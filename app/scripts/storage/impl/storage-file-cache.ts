import { Launcher } from 'comp/launcher';
import { StorageBase } from 'storage/storage-base';
import { StorageFileData, StorageSaveResult } from 'storage/types';
import * as fs from 'fs';
import * as NodePath from 'path';

class StorageFileCache extends StorageBase {
    private _path?: string;

    constructor() {
        super({
            name: 'cache',
            system: true
        });
    }

    get enabled(): boolean {
        return !!Launcher;
    }

    get locName(): string {
        return 'File cache';
    }

    private async init(): Promise<string> {
        if (this._path) {
            return Promise.resolve(this._path);
        }

        let path = await Launcher?.ipcRenderer.invoke('get-user-data-path');
        if (!path) {
            throw new Error('Failed to get user data path');
        }
        path = NodePath.join(path, 'OfflineFiles');
        try {
            await fs.promises.access(path);
        } catch (err) {
            await fs.promises.mkdir(path);
        }

        this._path = path;
        return path;
    }

    async save(id: string, data: ArrayBuffer): Promise<StorageSaveResult> {
        this._logger.info('Save', id);
        const basePath = await this.init();
        const ts = this._logger.ts();

        const path = NodePath.join(basePath, id);
        try {
            await fs.promises.writeFile(path, Buffer.from(data));
            this._logger.info('Saved', id, this._logger.ts(ts));
        } catch (err) {
            this._logger.error('Error saving to cache', id, err);
            throw err;
        }

        const stat = await fs.promises.stat(path);
        const newRev = stat.mtime.getTime().toString();

        return { rev: newRev };
    }

    async load(id: string): Promise<StorageFileData> {
        this._logger.info('Load', id);
        const basePath = await this.init();
        const ts = this._logger.ts();

        const path = NodePath.join(basePath, id);
        try {
            const data = await fs.promises.readFile(path);
            this._logger.info('Loaded', id, this._logger.ts(ts));

            const stat = await fs.promises.stat(path);
            const rev = stat.mtime.getTime().toString();

            return { data, rev };
        } catch (err) {
            this._logger.error('Error loading from cache', id, err);
            throw err;
        }
    }

    async remove(id: string): Promise<void> {
        this._logger.info('Remove', id);
        const basePath = await this.init();
        const ts = this._logger.ts();
        const path = NodePath.join(basePath, id);

        try {
            await fs.promises.access(path);
        } catch (err) {
            return;
        }

        try {
            await fs.promises.unlink(path);
            this._logger.info('Removed', id, this._logger.ts(ts));
        } catch (err) {
            this._logger.error('Error removing from cache', id, err);
            throw err;
        }
    }

    stat(): never {
        throw new Error('Stat on cache is not implemented');
    }

    list: undefined;
    mkdir: undefined;
    unwatch: undefined;
    watch: undefined;
    getPathForName: undefined;
    getOpenConfig: undefined;
    getSettingsConfig: undefined;
    applyConfig: undefined;
    applySetting: undefined;
}

export { StorageFileCache };
