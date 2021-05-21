import { IoBrowserCache } from 'storage/io-cache/io-browser-cache';
import { StorageBase } from 'storage/storage-base';
import { Launcher } from 'comp/launcher';
import { StorageFileOptions } from 'storage/types';

class StorageCache extends StorageBase {
    private readonly _io: IoBrowserCache;

    constructor() {
        super({ name: 'cache', system: true, enabled: !Launcher });
        this._io = new IoBrowserCache('FilesCache', this._logger);
    }

    save(id: string, opts: StorageFileOptions | undefined, data: ArrayBuffer): Promise<void> {
        return this._io.save(id, data);
    }

    load(id: string): Promise<ArrayBuffer> {
        return this._io.load(id);
    }

    remove(id: string): Promise<void> {
        return this._io.remove(id);
    }
}

export { StorageCache };
