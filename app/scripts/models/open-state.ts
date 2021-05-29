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

export class OpenState extends Model {
    id?: string;
    name?: string;
    password?: kdbxweb.ProtectedValue;
    storage?: string;
    path?: string;
    fileData?: ArrayBuffer;
    fileXml?: string;
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
            this.resetInternal();
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

    openFile(): void {
        if (this.busy || !AppSettings.canOpen) {
            return;
        }
        FileOpener.openBinary((file, fileData) => {
            const format = OpenState.getOpenFileFormat(fileData);
            switch (format) {
                case 'kdbx':
                    this.batchSet(() => {
                        this.resetInternal();
                        this.name = file.name.replace(/\.kdbx$/i, '');
                        this.fileData = fileData;
                        this.path = file.path || undefined;
                        this.storage = file.path ? 'file' : undefined;
                    });
                    break;
                case 'xml':
                    this.batchSet(() => {
                        this.resetInternal();
                        this.fileXml = kdbxweb.ByteUtils.bytesToString(fileData);
                        this.name = file.name.replace(/\.\w+$/i, '');
                    });
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
        });
    }

    openKeyFile(): void {
        if (this.busy || !AppSettings.canOpen) {
            return;
        }
        FileOpener.openBinary((file, keyFileData) => {
            this.batchSet(() => {
                this.resetKeyFileInternal();

                this.keyFileName = file.name;
                if (AppSettings.rememberKeyFiles === 'path' && file.path) {
                    this.keyFilePath = file.path;
                }
                this.keyFileData = keyFileData;
            });
        });
    }

    openKeyFileFromDropbox(): void {
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

    selectNextFile(): void {
        if (this.busy) {
            return;
        }
        let found = false;
        for (const fileInfo of FileManager.fileInfos) {
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
        let prevFileInfo: FileInfo | undefined;
        for (const fileInfo of FileManager.fileInfos) {
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

    private resetInternal() {
        this.id = undefined;
        this.name = undefined;
        this.password = kdbxweb.ProtectedValue.fromString('');
        this.storage = undefined;
        this.path = undefined;
        this.fileData = undefined;
        this.fileXml = undefined;
        this.keyFileName = undefined;
        this.keyFileData = undefined;
        this.keyFileHash = undefined;
        this.keyFilePath = undefined;
        this.rev = undefined;
        this.opts = undefined;
        this.chalResp = undefined;
    }

    private resetKeyFileInternal() {
        this.keyFileName = undefined;
        this.keyFileData = undefined;
        this.keyFileHash = undefined;
        this.keyFilePath = undefined;
    }

    private static getOpenFileFormat(fileData: ArrayBuffer): 'kdbx' | 'kdb' | 'xml' | undefined {
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
        } else {
            return undefined;
        }
    }
}
