import * as kdbxweb from 'kdbxweb';
import { Logger } from 'util/logger';
import { Storage } from 'storage';
import { Locale } from 'util/locale';
import { IdGenerator } from 'util/generators/id-generator';
import { OpenParams } from 'models/open-state';
import { FileManager } from 'models/file-manager';
import { File } from 'models/file';
import { FileInfo } from 'models/file-info';
import { StorageFileData, StorageFileStat } from 'storage/types';
import { AppSettings } from 'models/app-settings';

class FileController {
    async open(params: OpenParams): Promise<File> {
        const logger = new Logger('open', params.name);
        logger.info('File open request');

        if (!params.name) {
            throw new Error('Empty name');
        }

        const fileInfo = params.id
            ? FileManager.getFileInfoById(params.id)
            : FileManager.getFileInfo(params.name, params.storage, params.path);

        if (!params.opts && fileInfo && fileInfo.opts) {
            params.opts = fileInfo.opts;
        }

        if (fileInfo && fileInfo.modified) {
            logger.info('Open file from cache because it is modified');
            const file = await this.openFileFromCache(params, fileInfo, logger);
            logger.info('Sync just opened modified file');
            setTimeout(() => this.syncFile(file), 0);
            return file;
        } else if (params.fileData) {
            logger.info('Open file from supplied content');
            if (params.storage === 'file' && params.path) {
                const stat = await Storage.file.stat(params.path);
                params.rev = stat.rev;
                return this.openFileWithData(params, fileInfo, params.fileData, false);
            } else {
                return this.openFileWithData(params, fileInfo, params.fileData, true);
            }
        } else if (!params.storage && fileInfo) {
            logger.info('Open file from cache as main storage');
            return this.openFileFromCache(params, fileInfo, logger);
        } else if (
            fileInfo?.openDate &&
            fileInfo.rev === params.rev &&
            fileInfo.storage !== 'file' &&
            !AppSettings.disableOfflineStorage
        ) {
            logger.info('Open file from cache because it is latest');
            try {
                return this.openFileFromCache(params, fileInfo, logger);
            } catch (err) {
                if (err instanceof kdbxweb.KdbxError) {
                    // TODO: || err.ykError
                    throw err;
                }
                logger.info('Error loading file from cache, trying to open from storage', err);
                return this.openFileFromStorage(params, fileInfo, logger, true);
            }
        } else if (
            !fileInfo ||
            !fileInfo.openDate ||
            params.storage === 'file' ||
            AppSettings.disableOfflineStorage
        ) {
            return this.openFileFromStorage(params, fileInfo, logger, false);
        } else {
            logger.info('Open file from cache, will sync after load', params.storage);
            let file: File;
            try {
                file = await this.openFileFromCache(params, fileInfo, logger);
            } catch (err) {
                if (err instanceof kdbxweb.KdbxError) {
                    // TODO: || err.ykError
                    throw err;
                }
                logger.info('Error loading file from cache, trying to open from storage', err);
                return this.openFileFromStorage(params, fileInfo, logger, true);
            }

            logger.info('Sync just opened file');
            setTimeout(() => this.syncFile(file), 0);
            return file;
        }
    }

    private async openFileFromCache(
        params: OpenParams,
        fileInfo: FileInfo,
        logger: Logger
    ): Promise<File> {
        let data: ArrayBuffer;
        try {
            const res = await Storage.cache.load(fileInfo.id);
            if (!res?.data) {
                throw new Error(Locale.openFileNoCacheError);
            }
            data = res.data;
            logger.info('Loaded from cache');
        } catch (err) {
            logger.info('Loaded error from cache', err);
            throw err;
        }
        return this.openFileWithData(params, fileInfo, data, false);
    }

    private async openFileFromStorage(
        params: OpenParams,
        fileInfo: FileInfo | undefined,
        logger: Logger,
        noCache: boolean
    ): Promise<File> {
        if (!params.storage) {
            throw new Error('Storage open error: empty storage');
        }
        if (!params.path) {
            throw new Error('Storage open error: empty path');
        }

        logger.info('Open file from storage', params.storage);

        const storage = Storage.get(params.storage ?? '');
        if (!storage) {
            logger.error('Storage not found', storage);
            throw new Error(`Storage not found: ${storage ?? ''}`);
        }
        const cacheRev = (fileInfo && fileInfo.rev) || null;
        if (cacheRev && storage.stat) {
            logger.info('Stat file');
            let stat: StorageFileStat;
            try {
                stat = await storage.stat(params.path, params.opts);
            } catch (err) {
                if (
                    !noCache &&
                    fileInfo &&
                    storage.name !== 'file' &&
                    !AppSettings.disableOfflineStorage
                ) {
                    logger.info('Open file from cache because of stat error', err);
                    return this.openFileFromCache(params, fileInfo, logger);
                } else {
                    logger.info('Stat error', err);
                    throw err;
                }
            }
            if (
                !noCache &&
                fileInfo &&
                storage.name !== 'file' &&
                stat.rev === cacheRev &&
                !AppSettings.disableOfflineStorage
            ) {
                logger.info('Open file from cache because it is latest');
                return this.openFileFromCache(params, fileInfo, logger);
            }
            logger.info(`Open file from storage (${stat.rev ?? '(empty)'}, local ${cacheRev})`);
        }

        logger.info('Load from storage');
        let res: StorageFileData;
        try {
            res = await storage.load(params.path, params.opts);
        } catch (err) {
            if (fileInfo && fileInfo.openDate && !AppSettings.disableOfflineStorage) {
                logger.info('Open file from cache because of storage load error', err);
                return this.openFileFromCache(params, fileInfo, logger);
            } else {
                logger.info('Storage load error', err);
                throw err;
            }
        }

        logger.info('Open file from content loaded from storage');
        params.fileData = res.data;
        params.rev = res.rev;

        const needSaveToCache = storage.name !== 'file';
        return this.openFileWithData(params, fileInfo, res.data, needSaveToCache);
    }

    private async openFileWithData(
        params: OpenParams,
        fileInfo: FileInfo | undefined,
        data: ArrayBuffer,
        updateCacheOnSuccess: boolean
    ): Promise<File> {
        if (!params.name) {
            throw new Error('Open file without name');
        }
        if (!params.password) {
            throw new Error('Open file without password');
        }
        const logger = new Logger('open', params.name);

        let needLoadKeyFile = false;
        if (!params.keyFileData && fileInfo && fileInfo.keyFileName) {
            params.keyFileName = fileInfo.keyFileName;
            if (AppSettings.rememberKeyFiles === 'data' && fileInfo.keyFileHash) {
                params.keyFileData = File.createKeyFileWithHash(fileInfo.keyFileHash);
            } else if (AppSettings.rememberKeyFiles === 'path' && fileInfo.keyFilePath) {
                params.keyFilePath = fileInfo.keyFilePath;
                if (Storage.file.enabled) {
                    needLoadKeyFile = true;
                }
            }
        } else if (params.keyFilePath && !params.keyFileData && !fileInfo) {
            needLoadKeyFile = true;
        }

        if (needLoadKeyFile && params.keyFilePath) {
            let data: ArrayBuffer;
            try {
                const res = await Storage.file.load(params.keyFilePath);
                data = res.data;
            } catch (err) {
                logger.info('Storage load error', err);
                throw err;
            }
            params.keyFileData = data;
        }

        const id = fileInfo ? fileInfo.id : IdGenerator.uuid();

        if (FileManager.getFileById(id)) {
            throw new Error('Duplicate file id');
        }

        const file = await File.open(id, params.name, params.password, data, params.keyFileData);
        file.batchSet(() => {
            file.storage = params.storage;
            file.path = params.path;
            file.keyFileName = params.keyFileName;
            file.keyFilePath = params.keyFilePath;
            file.backup = fileInfo?.backup;
            file.chalResp = params.chalResp;
            file.syncDate = fileInfo?.syncDate;
            // if (params.encryptedPassword) { // TODO: touch id
            //     file.encryptedPassword = fileInfo?.encryptedPassword;
            //     file.encryptedPasswordDate = fileInfo?.encryptedPasswordDate || new Date();
            // }
        });

        if (fileInfo?.modified) {
            if (fileInfo.editState) {
                logger.info('Loaded local edit state');
                file.setLocalEditState(fileInfo.editState);
            }
            logger.info('Mark file as modified');
            file.modified = true;
        }
        if (updateCacheOnSuccess && !AppSettings.disableOfflineStorage && params.fileData) {
            logger.info('Save loaded file to cache');
            await Storage.cache.save(file.id, params.fileData);
        }

        const rev = params.rev || (fileInfo && fileInfo.rev);
        // this.setFileOpts(file, params.opts); // TODO: file opts

        logger.info('Add last open file', file.id, file.name, file.storage, file.path, rev);
        FileManager.addLastOpenFileInfo(file, rev);
        FileManager.addFile(file);
        // this.fileOpened(file, data, params); // TODO: fileOpened

        return file;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    syncFile(file: File): void {}
}

const instance = new FileController();

export { instance as FileController };
