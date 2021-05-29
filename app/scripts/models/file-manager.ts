import { File } from 'models/file';
import { FileInfo } from 'models/file-info';
import { SettingsStore } from 'comp/settings/settings-store';
import { Model } from 'util/model';
import { Storage } from 'storage';
import { Locale } from 'util/locale';

interface FileManagerEvents {
    'file-info-added': (id: string) => void;
    'file-info-removed': (id: string) => void;
    'file-added': (id: string) => void;
    'file-removed': (id: string) => void;
}

class FileManager extends Model<FileManagerEvents> {
    files: File[] = [];
    fileInfos: FileInfo[] = [];

    async init() {
        await this.loadFileInfos();
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

    private fileClosed(file: File) {
        if (file.storage === 'file' && file.path) {
            Storage.file.unwatch(file.path);
        }
        this.emit('file-removed', file.id);
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

    private async saveFileInfos() {
        await SettingsStore.save('file-info', this.fileInfos);
    }
}

const instance = new FileManager();

export { instance as FileManager };
