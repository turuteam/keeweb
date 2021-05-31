import * as kdbxweb from 'kdbxweb';
import { Logger } from 'util/logger';
import { Storage } from 'storage';
import { Locale } from 'util/locale';
import { IdGenerator } from 'util/generators/id-generator';
import { OpenParams } from 'models/open-state';
import { FileManager } from 'models/file-manager';
import { File } from 'models/file';
import { FileInfo } from 'models/file-info';
import {
    StorageFileData,
    StorageFileNotFoundError,
    StorageFileOptions,
    StorageFileStat,
    StorageRevConflictError,
    StorageSaveResult
} from 'storage/types';
import { AppSettings } from 'models/app-settings';
import { errorToString, noop } from 'util/fn';
import { StorageBase } from 'storage/storage-base';

const MaxLoadLoops = 3;

interface FileSyncOptions {
    storage?: string;
    path?: string;
    opts: StorageFileOptions;
}

interface SyncContext {
    logger: Logger;
    file: File;
    fileInfo: FileInfo;
    storage: StorageBase;
    path: string;
    stat?: StorageFileStat;
    opts?: StorageFileOptions;
    retryCount: number;
}

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
            setTimeout(() => {
                this.syncFile(file).catch(noop);
            }, 0);
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
            setTimeout(() => {
                this.syncFile(file).catch(noop);
            }, 0);
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

    async syncFile(file: File, options?: FileSyncOptions): Promise<void> {
        if (file.demo) {
            return;
        }
        const logger = new Logger('sync', file.name);

        const storageName = options?.storage || file.storage;
        const storage = storageName ? Storage.get(storageName) : undefined;
        const opts = options?.opts || file.opts;
        let path = options?.path || file.path;
        if (storage?.getPathForName && (!path || storage.name !== file.storage)) {
            path = storage.getPathForName(file.name);
        }

        const optionsForLogging = { ...options };
        if (optionsForLogging.opts && optionsForLogging.opts.password) {
            optionsForLogging.opts = { ...optionsForLogging.opts };
            optionsForLogging.opts.password = '***';
        }
        logger.info('Sync started', storage, path, optionsForLogging);
        const fileInfo = this.getOrCreateFileInfo(file, logger);

        let syncError: unknown;
        try {
            if (file.syncing) {
                throw new Error('Sync in progress');
            }
            file.setSyncProgress();
            if (!storage) {
                if (!file.modified && fileInfo.id === file.id) {
                    logger.info('Local, not modified');
                } else {
                    logger.info('Local, save to cache');
                    const data = await file.getData();
                    try {
                        await Storage.cache.save(fileInfo.id, data);
                        logger.info('Saved to cache');
                    } catch (err) {
                        logger.info('Cache save error', err);
                        throw err;
                    }
                    // this.scheduleBackupFile(file, data); // TODO: backups
                }
            } else {
                if (!path) {
                    throw new Error('Cannot sync file to storage but without path');
                }
                const ctx: SyncContext = {
                    logger,
                    file,
                    fileInfo,
                    storage,
                    path,
                    opts,
                    retryCount: 0
                };

                logger.info('Stat file');
                let stat: StorageFileStat | undefined;
                try {
                    stat = await storage.stat(path, opts);
                    ctx.stat = stat;
                } catch (err) {
                    if (err instanceof StorageFileNotFoundError) {
                        logger.info('File does not exist in storage, creating');
                        await this.saveToCacheAndStorage(ctx);
                    } else if (file.dirty) {
                        if (AppSettings.disableOfflineStorage) {
                            logger.info('Stat error, dirty, cache is disabled', err);
                            throw err;
                        }
                        logger.info('Stat error, dirty, save to cache');
                        const data = await file.getData();
                        try {
                            await Storage.cache.save(fileInfo.id, data);
                            file.dirty = false;
                            logger.info('Saved to cache, exit with error', err);
                        } catch (e) {
                            logger.error('Error saving to cache', e);
                        }
                        throw err;
                    } else {
                        logger.info('Stat error, not dirty', err);
                        throw err;
                    }
                }

                if (stat) {
                    if (stat.rev === fileInfo.rev) {
                        if (file.modified) {
                            logger.info('Stat found same version, modified, saving');
                            await this.saveToCacheAndStorage(ctx);
                        } else {
                            logger.info('Stat found same version, not modified');
                        }
                    } else {
                        logger.info('Found new version, loading from storage');
                        await this.loadFromStorageAndMerge(ctx);
                    }
                }
            }

            logger.info('Sync finished OK');
        } catch (e) {
            syncError = e;
            logger.error('Sync finished with error', syncError);
        }

        file.setSyncComplete(path, storageName, syncError ? errorToString(syncError) : undefined);
        fileInfo.batchSet(() => {
            fileInfo.name = file.name;
            fileInfo.storage = storageName;
            fileInfo.path = path;
            // fileInfo.opts = this.getStoreOpts(file); // TODO: storage opts
            fileInfo.modified = file.dirty ? fileInfo.modified : file.modified;
            fileInfo.editState = file.dirty ? fileInfo.editState : file.getLocalEditState();
            fileInfo.syncDate = file.syncDate;
            fileInfo.chalResp = file.chalResp;

            if (AppSettings.rememberKeyFiles === 'data') {
                fileInfo.keyFileName = file.keyFileName;
                fileInfo.keyFileHash = file.getKeyFileHash();
            }
        });

        if (!FileManager.getFileById(fileInfo.id)) {
            FileManager.addFileInfo(fileInfo, true);
        }

        if (syncError) {
            throw syncError;
        }
    }

    private getOrCreateFileInfo(file: File, logger: Logger): FileInfo {
        let fileInfo = FileManager.getFileInfoById(file.id);
        if (!fileInfo) {
            logger.info('Create new file info');
            const dt = new Date();
            fileInfo = new FileInfo({
                id: file.id,
                name: file.name,
                storage: file.storage,
                path: file.path,
                // opts: this.getStoreOpts(file), // TODO: store opts
                modified: file.modified,
                syncDate: dt,
                openDate: dt,
                backup: file.backup
            });
        }
        return fileInfo;
    }

    private async saveToStorage(ctx: SyncContext, data: ArrayBuffer) {
        ctx.logger.info('Save data to storage');
        const storageRev = ctx.fileInfo.storage === ctx.storage.name ? ctx.fileInfo.rev : undefined;
        let saveResult: StorageSaveResult;
        try {
            saveResult = await ctx.storage.save(ctx.path, data, ctx.opts, storageRev);
        } catch (err) {
            if (err instanceof StorageRevConflictError) {
                ctx.logger.info('Save rev conflict, reloading from storage');
                await this.loadFromStorageAndMerge(ctx);
                return;
            } else {
                ctx.logger.info('Error saving data to storage');
                throw err;
            }
        }
        if (saveResult.rev) {
            ctx.logger.info('Update rev in file info');
            ctx.fileInfo.rev = saveResult.rev;
        }
        if (saveResult.path) {
            ctx.logger.info('Update path in file info', saveResult.path);
            ctx.file.path = saveResult.path;
            ctx.fileInfo.path = saveResult.path;
            ctx.path = saveResult.path;
        }
        ctx.file.syncDate = new Date();
        ctx.logger.info('Save to storage complete, updated sync date');
        // this.scheduleBackupFile(file, data); // TODO: backups
    }

    private async saveToCacheAndStorage(ctx: SyncContext) {
        ctx.logger.info('Getting file data for saving');
        const data = await ctx.file.getData();
        if (ctx.storage.name === 'file') {
            ctx.logger.info('Saving to file storage');
        } else if (!ctx.file.dirty) {
            ctx.logger.info('Saving to storage, skip cache because not dirty');
        } else if (AppSettings.disableOfflineStorage) {
            ctx.logger.info('Saving to storage, cache is disabled');
        } else {
            ctx.logger.info('Saving to cache');
            await Storage.cache.save(ctx.file.id, data);
            ctx.file.dirty = false;
            ctx.logger.info('Saved to cache, saving to storage');
        }
        await this.saveToStorage(ctx, data);
    }

    private async loadFromStorageAndMerge(ctx: SyncContext) {
        if (++ctx.retryCount === MaxLoadLoops) {
            throw new Error('Too many load attempts');
        }
        ctx.logger.info('Load from storage, attempt', ctx.retryCount);
        const storageLoadRes = await ctx.storage.load(ctx.path, ctx.opts);
        ctx.logger.info('Load from storage', storageLoadRes.rev);

        try {
            await ctx.file.mergeOrUpdate(storageLoadRes.data);
            ctx.logger.info('Merge complete OK');
        } catch (err) {
            ctx.logger.info('Merge error', err);
            // this.refresh(); // TODO: trigger refresh
            if (
                err instanceof kdbxweb.KdbxError &&
                err.code === kdbxweb.Consts.ErrorCodes.InvalidKey
            ) {
                ctx.logger.info('Remote key changed, request to enter new key');
                // Events.emit('remote-key-changed', { file }); // TODO: show the key change screen
            }
            throw err;
        }
        if (ctx.stat?.rev) {
            ctx.logger.info('Update rev in file info');
            ctx.fileInfo.rev = ctx.stat.rev;
        }
        ctx.file.syncDate = new Date();
        if (ctx.file.modified) {
            ctx.logger.info('Updated sync date, saving modified file');
            await this.saveToCacheAndStorage(ctx);
        } else if (ctx.file.dirty) {
            if (AppSettings.disableOfflineStorage) {
                ctx.logger.info('File is dirty and cache is disabled');
                throw new Error('File is dirty and cache is disabled');
            }
            ctx.logger.info('Saving not modified dirty file to cache');
            await Storage.cache.save(ctx.fileInfo.id, storageLoadRes.data);
            ctx.file.dirty = false;
            ctx.logger.info('Complete, remove dirty flag');
        } else {
            ctx.logger.info('Complete, no changes');
        }
    }
}

const instance = new FileController();

export { instance as FileController };
