import { File } from 'models/file';
import { FileInfo } from 'models/file-info';
import { SettingsStore } from 'comp/settings/settings-store';
import { TypedEmitter } from 'tiny-typed-emitter';

interface FileManagerEvents {
    'file-infos-changed': () => void;
    'file-info-added': (id: string) => void;
    'file-info-removed': (id: string) => void;
    'files-changed': () => void;
    'file-added': (id: string) => void;
    'file-removed': (id: string) => void;
}

class FileManager extends TypedEmitter<FileManagerEvents> {
    private readonly _files: File[] = [];
    private readonly _fileInfos: FileInfo[] = [];

    async init() {
        await this.loadFileInfos();
    }

    reset() {
        this._files.length = 0;
        this._fileInfos.length = 0;
    }

    hasOpenFiles() {
        return this._files.length;
    }

    hasUnsavedFiles() {
        return this._files.some((file) => file.modified);
    }

    hasDirtyFiles() {
        return this._files.some((file) => file.dirty);
    }

    getFileById(id: string): File | undefined {
        return this._files.find((f) => f.id === id);
    }

    getFileInfoById(id: string): FileInfo | undefined {
        return this._fileInfos.find((f) => f.id === id);
    }

    getFileByName(name: string): File | undefined {
        return this._files.find((file) => file.name.toLowerCase() === name.toLowerCase());
    }

    getFileInfo(
        name: string,
        storage: string | undefined,
        path: string | undefined
    ): FileInfo | undefined {
        return this._fileInfos.find((fi) => {
            return fi.name === name && fi.storage === storage && fi.path === path;
        });
    }

    addFileInfo(fi: FileInfo, asFirst?: boolean) {
        if (asFirst) {
            this._fileInfos.unshift(fi);
        } else {
            this._fileInfos.push(fi);
        }
        this.emit('file-info-added', fi.id);
        this.emit('file-infos-changed');
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
        await SettingsStore.save('file-info', this._fileInfos);
    }
}

const instance = new FileManager();

export { instance as FileManager };
