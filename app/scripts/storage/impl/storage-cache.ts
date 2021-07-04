import { IoBrowserCache } from 'storage/io-cache/io-browser-cache';
import { StorageBase } from 'storage/storage-base';
import { Launcher } from 'comp/launcher';
import { StorageFileData, StorageSaveResult } from 'storage/types';

class StorageCache extends StorageBase {
    private readonly _io: IoBrowserCache;

    constructor() {
        super({ name: 'cache', system: true });
        this._io = new IoBrowserCache('FilesCache', this._logger);
    }

    get enabled(): boolean {
        return !Launcher;
    }

    get locName(): string {
        return 'Cache';
    }

    async save(id: string, data: ArrayBuffer): Promise<StorageSaveResult> {
        await this._io.save(id, data);
        return {};
    }

    async load(id: string): Promise<StorageFileData> {
        const data = await this._io.load(id);
        return { data };
    }

    remove(id: string): Promise<void> {
        return this._io.remove(id);
    }

    stat(): never {
        throw new Error('Not supported');
    }

    list: undefined;
    mkdir: undefined;
    watch: undefined;
    unwatch: undefined;
    getPathForName: undefined;
    getOpenConfig: undefined;
    getSettingsConfig: undefined;
    applyConfig: undefined;
    applySetting: undefined;
}

export { StorageCache };
