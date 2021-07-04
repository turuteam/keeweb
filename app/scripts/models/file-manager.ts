import { File } from 'models/file';
import { FileInfo } from 'models/file-info';
import { SettingsStore } from 'comp/settings/settings-store';
import { DefaultModelEvents, Model } from 'util/model';
import { Storage } from 'storage';
import { Locale } from 'util/locale';
import { AppSettings } from 'models/app-settings';
import { noop } from 'util/fn';
import debounce from 'lodash.debounce';
import { Timeouts } from 'const/timeouts';

interface FileManagerEvents extends DefaultModelEvents {
    'file-info-added': (id: string) => void;
    'file-info-removed': (id: string) => void;
    'file-added': (id: string) => void;
    'file-removed': (id: string) => void;
}

class FileManager extends Model<FileManagerEvents> {
    files: File[] = [];
    fileInfos: FileInfo[] = [];

    private _saveFileInfosBound: () => void;

    constructor() {
        super();
        this._saveFileInfosBound = () => this.saveFileInfos().catch(noop);
    }

    async init() {
        await this.loadFileInfos();
        (this as FileManager).onChange('fileInfos', () => this.saveFileInfosDelayed());
    }

    reset(): void {
        this.files.length = 0;
        this.fileInfos.length = 0;
    }

    get hasOpenFiles(): boolean {
        return this.files.length > 0;
    }

    get hasUnsavedFiles(): boolean {
        return this.files.some((file) => file.modified);
    }

    get hasDirtyFiles(): boolean {
        return this.files.some((file) => file.dirty);
    }

    getFileById(id: string): File | undefined {
        return this.files.find((f) => f.id === id);
    }

    getFileInfoById(id: string): FileInfo | undefined {
        return this.fileInfos.find((f) => f.id === id);
    }

    getFileByName(name: string): File | undefined {
        return this.files.find((file) => file.name.toLowerCase() === name.toLowerCase());
    }

    getFileInfoByName(name: string): FileInfo | undefined {
        return this.fileInfos.find((f) => f.name.toLowerCase() === name.toLowerCase());
    }

    getFileInfo(
        name: string,
        storage: string | undefined,
        path: string | undefined
    ): FileInfo | undefined {
        return this.fileInfos.find((fi) => {
            return fi.name === name && fi.storage === storage && fi.path === path;
        });
    }

    getNewFileName(): string {
        for (let i = 0; ; i++) {
            const name = `${Locale.openNewFile}${i || ''}`;
            if (!this.getFileByName(name) && !this.getFileInfoByName(name)) {
                return name;
            }
        }
    }

    addFileInfo(fi: FileInfo, asFirst?: boolean): void {
        if (asFirst) {
            this.fileInfos = [fi].concat(this.fileInfos);
        } else {
            this.fileInfos = this.fileInfos.concat(fi);
        }
        this.watchFileInfo(fi);
        this.emit('file-info-added', fi.id);
    }

    addFile(file: File): void {
        if (this.getFileById(file.id)) {
            return;
        }
        this.files = this.files.concat(file);
        this.emit('file-added', file.id);
    }

    closeAll(): void {
        if (!this.hasOpenFiles) {
            return;
        }
        for (const file of this.files) {
            file.close();
            this.fileClosed(file);
        }
        this.files = [];
    }

    close(file: File): void {
        file.close();
        this.fileClosed(file);
        this.files = this.files.filter((f) => f !== file);
    }

    getFirstFileInfoToOpen(): FileInfo | undefined {
        for (const fi of this.fileInfos) {
            if (!this.getFileById(fi.id)) {
                return fi;
            }
        }
    }

    removeFileInfo(id: string): void {
        const fileInfo = this.getFileInfoById(id);
        if (!fileInfo) {
            throw new Error('FileInfo not found');
        }
        const file = this.getFileById(id);
        if (file) {
            throw new Error('Cannot remove FileInfo while the file is open');
        }
        this.fileInfos = this.fileInfos.filter((fi) => fi.id !== id);
        this.emit('file-info-removed', id);
    }

    addLastOpenFileInfo(file: File, rev?: string): void {
        const dt = new Date();
        const fileInfo = new FileInfo({
            id: file.id,
            name: file.name,
            storage: file.storage,
            path: file.path,
            // opts: this.getStoreOpts(file), // TODO: opts
            modified: file.modified,
            editState: file.getLocalEditState(),
            rev,
            syncDate: file.syncDate || dt,
            openDate: dt,
            backup: file.backup,
            chalResp: file.chalResp
        });
        switch (AppSettings.rememberKeyFiles) {
            case 'data':
                fileInfo.keyFileName = file.keyFileName;
                fileInfo.keyFileHash = file.getKeyFileHash();
                break;
            case 'path':
                fileInfo.keyFileName = file.keyFileName;
                fileInfo.keyFilePath = file.keyFilePath;
                break;
        }
        if (AppSettings.deviceOwnerAuth === 'file' && file.encryptedPassword) {
            // const maxDate = new Date(file.encryptedPasswordDate); // TODO: encrypted passwords
            // maxDate.setMinutes(maxDate.getMinutes() + this.settings.deviceOwnerAuthTimeoutMinutes);
            // if (maxDate > new Date()) {
            //     fileInfo.encryptedPassword = file.encryptedPassword;
            //     fileInfo.encryptedPasswordDate = file.encryptedPasswordDate;
            // }
        }

        const existed = this.getFileInfoById(file.id);
        this.fileInfos = [fileInfo].concat(this.fileInfos.filter((fi) => fi.id !== file.id));

        if (!existed) {
            this.emit('file-info-added', file.id);
        }
        this.watchFileInfo(fileInfo);
    }

    hasWritableFiles(): boolean {
        return this.files.some((f) => !f.readOnly);
    }

    clearStoredKeyFiles(): void {
        for (const fileInfo of this.fileInfos) {
            fileInfo.clearKeyFile();
        }
        this.saveFileInfosDelayed();
    }

    private fileClosed(file: File) {
        if (file.storage === 'file' && file.path) {
            Storage.file.unwatch(file.path);
        }
        this.emit('file-removed', file.id);
    }

    private watchFileInfo(fileInfo: FileInfo) {
        fileInfo.on('change', () => this.saveFileInfosDelayed());
    }

    private async loadFileInfos() {
        const data = await SettingsStore.load('file-info');
        if (Array.isArray(data)) {
            for (const item of data) {
                const fi = FileInfo.fromStored(item);
                if (fi) {
                    this.addFileInfo(fi);
                }
            }
        }
    }

    private saveFileInfosDelayed() {
        debounce(this._saveFileInfosBound, Timeouts.SaveFileInfoDebounce, { leading: true });
    }

    private async saveFileInfos() {
        await SettingsStore.save('file-info', this.fileInfos);
    }
}

const instance = new FileManager();

export { instance as FileManager };
