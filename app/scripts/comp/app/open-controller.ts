import * as kdbxweb from 'kdbxweb';
import { FileManager } from 'models/file-manager';
import { Workspace } from 'models/workspace';
import { AppSettings } from 'models/app-settings';
import { FileOpener } from 'util/browser/file-opener';
import { Alerts } from 'comp/ui/alerts';
import { Locale } from 'util/locale';
import { errorToString } from 'util/fn';
import { DropboxChooser } from 'storage/dropbox-chooser';
import { Logger } from 'util/logger';
import { FileController } from 'comp/app/file-controller';
import { OpenState } from 'models/ui/open-state';
import { StorageBase } from 'storage/storage-base';
import { BrowserAuthStartedError, OAuthRejectedError } from 'storage/types';
import { FunctionComponent, h } from 'preact';
import { OpenStorageFileList, OpenStorageFileListFile } from 'ui/open/open-storage-file-list';

const logger = new Logger('open');

class OpenController {
    open(): void {
        if (OpenState.busy) {
            return;
        }
        if (OpenState.id && FileManager.getFileById(OpenState.id)) {
            Workspace.showList();
            return;
        }

        OpenState.beginOpen();

        FileController.open(OpenState)
            .then(() => {
                Workspace.showList();
            })
            .catch((err) => {
                logger.error('Open error', err);
                const invalidKey =
                    err instanceof kdbxweb.KdbxError &&
                    err.code === kdbxweb.Consts.ErrorCodes.InvalidKey;
                OpenState.setOpenError(invalidKey);
                if (!invalidKey) {
                    // } else if (err.userCanceled) { // TODO: yubikey cancellation
                    // if (err.notFound) { // TODO: handle file not found
                    //     err = Locale.openErrorFileNotFound;
                    // }
                    const alertBody = Locale.openErrorDescription;
                    // if (err.maybeTouchIdChanged) { // TODO: handle touch ID
                    //     alertBody += '\n' + Locale.openErrorDescriptionMaybeTouchIdChanged;
                    // }
                    Alerts.error({
                        header: Locale.openError,
                        body: alertBody,
                        pre: errorToString(err)
                    });
                }
            });
    }

    selectKeyFileFromDropbox(): void {
        if (OpenState.busy || !AppSettings.canOpen) {
            return;
        }
        const dropboxChooser = new DropboxChooser((err, res) => {
            if (!err && res) {
                OpenState.setKeyFile(res.name, res.data);
            }
        });
        dropboxChooser.choose();
    }

    chooseFile(): void {
        if (OpenState.busy || !AppSettings.canOpen) {
            return;
        }
        FileOpener.open((file) => {
            this.readFile(file).catch((e) => logger.error('Error selecting file', e));
        });
    }

    async readFile(file: File): Promise<void> {
        const fileData = await FileOpener.readBinary(file);
        const format = OpenController.getOpenFileFormat(file, fileData);
        switch (format) {
            case 'kdbx': {
                const name = file.name.replace(/\.kdbx$/i, '');
                OpenState.setFile(
                    name,
                    fileData,
                    file.path || undefined,
                    file.path ? 'file' : undefined
                );
                break;
            }
            case 'xml': {
                const name = file.name.replace(/\.\w+$/i, '');
                const xml = kdbxweb.ByteUtils.bytesToString(fileData);
                try {
                    await Workspace.importFileFromXml(name, xml);
                } catch (e) {
                    logger.error('Error importing XML', e);
                    Alerts.error({
                        header: Locale.openXml,
                        body: Locale.openError,
                        pre: errorToString(e)
                    });
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
        if (OpenState.busy || !AppSettings.canOpen) {
            return;
        }
        FileOpener.open((file) => {
            this.readKeyFile(file).catch((e) => logger.error('Error selecting keyfile', e));
        });
    }

    async readKeyFile(file: File): Promise<void> {
        const keyFileData = await FileOpener.readBinary(file);
        const path = AppSettings.rememberKeyFiles === 'path' && file.path ? file.path : undefined;
        OpenState.setKeyFile(file.name, keyFileData, path);
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

    listStorage(storage: StorageBase, dir?: string, prevDir?: string): void {
        if (OpenState.busy || !storage.list) {
            return;
        }
        OpenState.setStorageProgress(storage.name);
        storage
            .list(dir)
            .then((files) => {
                OpenState.resetStorageProgress();

                if (!files.length) {
                    Alerts.error({
                        header: Locale.openNothingFound,
                        body: Locale.openNothingFoundBody
                    });
                    return;
                }

                const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
                files.sort((x, y) => {
                    if (x.dir !== y.dir) {
                        return (y.dir ? 1 : 0) - (x.dir ? 1 : 0);
                    }
                    return collator.compare(x.path, y.path);
                });
                if (dir) {
                    files.unshift({
                        path: prevDir ?? '',
                        name: '..',
                        dir: true
                    });
                }

                this.showStorageFileListAlert(storage, files, dir);
            })
            .catch((e) => {
                OpenState.resetStorageProgress();
                if (e instanceof BrowserAuthStartedError || e instanceof OAuthRejectedError) {
                    return;
                }
                if (!Alerts.alertDisplayed) {
                    Alerts.error({
                        header: Locale.openError,
                        body: Locale.openListErrorBody,
                        pre: errorToString(e)
                    });
                }
            });
    }

    private showStorageFileListAlert(
        storage: StorageBase,
        files: OpenStorageFileListFile[],
        currentDir?: string
    ) {
        const listView: FunctionComponent = () => {
            const fileSelected = (file: OpenStorageFileListFile) => {
                if (file.dir) {
                    this.listStorage(storage, file.path, currentDir);
                } else {
                    // this.openStorageFile(storage, file);
                }
            };

            return h(OpenStorageFileList, {
                files,
                fileSelected
            });
        };

        Alerts.alert({
            header: Locale.openSelectFile,
            body: Locale.openSelectFileBody,
            icon: storage.icon || 'file-alt',
            buttons: [{ result: '', title: Locale.alertCancel }],
            esc: '',
            click: '',
            view: listView
        });
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

    private static async showLocalFileAlert(): Promise<void> {
        if (AppSettings.skipOpenLocalWarn) {
            return;
        }
        const res = await Alerts.alert({
            header: Locale.openLocalFile,
            body: Locale.openLocalFileBody,
            icon: 'file-alt',
            buttons: [
                { result: 'skip', title: Locale.openLocalFileDontShow, error: true },
                { result: 'ok', title: Locale.alertOk }
            ],
            click: '',
            esc: '',
            enter: ''
        }).wait();

        if (res === 'skip') {
            AppSettings.skipOpenLocalWarn = true;
        }
    }
}

const instance = new OpenController();

export { instance as OpenController };
