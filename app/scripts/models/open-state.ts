import * as kdbxweb from 'kdbxweb';
import { Model } from 'util/model';
import { StorageFileOptions } from 'storage/types';
import { FileChalRespConfig, FileInfo } from 'models/file-info';
import { FileOpener } from 'util/browser/file-opener';
import { AppSettings } from 'models/app-settings';
import { Alerts } from 'comp/ui/alerts';
import { Locale } from 'util/locale';
import { FileManager } from 'models/file-manager';
import { DropboxChooser } from 'storage/dropbox-chooser';
import { Logger } from 'util/logger';
import { Workspace } from 'models/workspace';

const logger = new Logger('open');

export class OpenState extends Model {
    id?: string;
    name?: string;
    password?: kdbxweb.ProtectedValue;
    storage?: string;
    path?: string;
    fileData?: ArrayBuffer;
    keyFileName?: string;
    keyFileData?: ArrayBuffer;
    keyFileHash?: string;
    keyFilePath?: string;
    rev?: string;
    opts?: StorageFileOptions;
    chalResp?: FileChalRespConfig;

    busy = false;
    secondRowVisible = false;
    autoFocusPassword = true;
    capsLockPressed = false;
    visualFocus = false;
    dragInProgress = false;

    constructor() {
        super();

        const fileInfo = FileManager.getFirstFileInfoToOpen();
        if (fileInfo) {
            this.selectFileInfo(fileInfo);
        }
    }

    selectFileInfo(fileInfo: FileInfo): void {
        if (this.busy) {
            return;
        }
        this.batchSet(() => {
            this.reset();
            this.id = fileInfo.id;
            this.name = fileInfo.name;
            this.storage = fileInfo.storage;
            this.path = fileInfo.path;
            this.keyFileName = fileInfo.keyFileName;
            this.keyFileHash = fileInfo.keyFileHash;
            this.keyFilePath = fileInfo.keyFilePath;
            this.rev = fileInfo.rev;
            this.opts = fileInfo.opts;
            this.chalResp = fileInfo.chalResp;
        });
    }

    chooseFile(): void {
        if (this.busy || !AppSettings.canOpen) {
            return;
        }
        FileOpener.open((file) => {
            this.readFile(file).catch((e) => logger.error('Error selecting file', e));
        });
    }

    async readFile(file: File): Promise<void> {
        const fileData = await FileOpener.readBinary(file);
        const format = OpenState.getOpenFileFormat(file, fileData);
        switch (format) {
            case 'kdbx':
                this.batchSet(() => {
                    this.reset();
                    this.name = file.name.replace(/\.kdbx$/i, '');
                    this.fileData = fileData;
                    this.path = file.path || undefined;
                    this.storage = file.path ? 'file' : undefined;
                });
                break;
            case 'xml': {
                const name = file.name.replace(/\.\w+$/i, '');
                const xml = kdbxweb.ByteUtils.bytesToString(fileData);
                try {
                    await Workspace.importFileFromXml(name, xml);
                } catch (e) {
                    logger.error('Error importing XML', e);
                }
                break;
            }
            case 'csv':
                // TODO: load CSV
                break;
            case 'kdb':
                Alerts.error({
                    header: Locale.openWrongFile,
                    body: Locale.openKdbFileBody
                });
                break;
            default:
                Alerts.error({
                    header: Locale.openWrongFile,
                    body: Locale.openWrongFileBody
                });
                break;
        }
    }

    chooseKeyFile(): void {
        if (this.busy || !AppSettings.canOpen) {
            return;
        }
        FileOpener.open((file) => {
            this.readKeyFile(file).catch((e) => logger.error('Error selecting keyfile', e));
        });
    }

    async readKeyFile(file: File): Promise<void> {
        const keyFileData = await FileOpener.readBinary(file);
        this.batchSet(() => {
            this.resetKeyFileInternal();

            this.keyFileName = file.name;
            if (AppSettings.rememberKeyFiles === 'path' && file.path) {
                this.keyFilePath = file.path;
            }
            this.keyFileData = keyFileData;
        });
    }

    selectKeyFileFromDropbox(): void {
        if (this.busy || !AppSettings.canOpen) {
            return;
        }
        const dropboxChooser = new DropboxChooser((err, res) => {
            if (!err && res) {
                this.batchSet(() => {
                    this.resetKeyFileInternal();

                    this.keyFileName = res.name;
                    this.keyFileData = res.data;
                });
            }
        });
        dropboxChooser.choose();
    }

    clearKeyFile(): void {
        if (this.busy) {
            return;
        }
        this.batchSet(() => {
            this.resetKeyFileInternal();
        });
    }

    readDroppedFiles(files: File[]): void {
        if (!files.length) {
            return;
        }

        const dataFile = files.find((file) => /\.kdbx$/i.test(file.name));
        const keyFile = files.find((file) => /\.keyx?$/i.test(file.name));

        if (dataFile) {
            this.readFileAndKeyFile(dataFile, keyFile);
            return;
        }

        this.readFile(files[0]).catch((e) => logger.error('Error reading dropped files', e));
    }

    readFileAndKeyFile(file: File, keyFile?: File): void {
        this.readFile(file)
            .then(() => {
                if (keyFile) {
                    return this.readKeyFile(keyFile);
                }
            })
            .catch((e) => {
                logger.error('Error reading file and keyfile', e);
            });
    }

    selectNextFile(): void {
        if (this.busy) {
            return;
        }
        if (!this.id) {
            const [first] = FileManager.getFileInfosToOpen();
            if (first) {
                this.selectFileInfo(first);
            }
            return;
        }
        let found = false;
        for (const fileInfo of FileManager.getFileInfosToOpen()) {
            if (found) {
                this.selectFileInfo(fileInfo);
                return;
            }
            if (fileInfo.id === this.id) {
                found = true;
            }
        }
    }

    selectPreviousFile(): void {
        if (this.busy) {
            return;
        }
        if (!this.id) {
            const fileInfos = FileManager.getFileInfosToOpen();
            if (fileInfos.length) {
                this.selectFileInfo(fileInfos[fileInfos.length - 1]);
            }
            return;
        }
        let prevFileInfo: FileInfo | undefined;
        for (const fileInfo of FileManager.getFileInfosToOpen()) {
            if (fileInfo.id === this.id) {
                if (prevFileInfo) {
                    this.selectFileInfo(prevFileInfo);
                }
                return;
            }
            prevFileInfo = fileInfo;
        }
    }

    open(): void {
        // TODO
    }

    reset(): void {
        this.batchSet(() => {
            this.id = undefined;
            this.name = undefined;
            this.password = kdbxweb.ProtectedValue.fromString('');
            this.storage = undefined;
            this.path = undefined;
            this.fileData = undefined;
            this.keyFileName = undefined;
            this.keyFileData = undefined;
            this.keyFileHash = undefined;
            this.keyFilePath = undefined;
            this.rev = undefined;
            this.opts = undefined;
            this.chalResp = undefined;
        });
    }

    private resetKeyFileInternal() {
        this.keyFileName = undefined;
        this.keyFileData = undefined;
        this.keyFileHash = undefined;
        this.keyFilePath = undefined;
    }

    private static getOpenFileFormat(
        file: File,
        fileData: ArrayBuffer
    ): 'kdbx' | 'kdb' | 'xml' | 'csv' | undefined {
        if (fileData.byteLength < 8) {
            return undefined;
        }
        const fileSig = new Uint32Array(fileData, 0, 2);
        if (fileSig[0] === kdbxweb.Consts.Signatures.FileMagic) {
            if (fileSig[1] === kdbxweb.Consts.Signatures.Sig2Kdb) {
                return 'kdb';
            } else if (fileSig[1] === kdbxweb.Consts.Signatures.Sig2Kdbx) {
                return 'kdbx';
            } else {
                return undefined;
            }
        } else if (AppSettings.canImportXml) {
            try {
                const str = kdbxweb.ByteUtils.bytesToString(fileSig).trim();
                if (str.startsWith('<?xml')) {
                    return 'xml';
                }
            } catch (e) {}
            return undefined;
        } else if (AppSettings.canImportCsv && /\.csv$/i.test(file.name)) {
            return 'csv';
        } else {
            return undefined;
        }
    }
}
