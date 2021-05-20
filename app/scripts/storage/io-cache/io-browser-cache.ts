import { IoCacheBase } from './io-cache-base';

export class IoBrowserCache extends IoCacheBase {
    private _db?: IDBDatabase;

    private openDb(): Promise<IDBDatabase> {
        if (this._db) {
            return Promise.resolve(this._db);
        }
        return new Promise((resolve, reject) => {
            try {
                const req = indexedDB.open(this.cacheName);
                req.onerror = (e) => {
                    this.logger.error('Error opening indexed db', e);
                    reject(e);
                };
                req.onsuccess = () => {
                    this._db = req.result;
                    resolve(this._db);
                };
                req.onupgradeneeded = () => {
                    const db = req.result;
                    db.createObjectStore('files');
                };
            } catch (e) {
                this.logger.error('Error opening indexed db', e);
                reject(e);
            }
        });
    }

    async save(id: string, data: ArrayBuffer): Promise<void> {
        this.logger.debug('Save', id);
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            try {
                const ts = this.logger.ts();
                const req = db
                    .transaction(['files'], 'readwrite')
                    .objectStore('files')
                    .put(data, id);
                req.onsuccess = () => {
                    this.logger.debug('Saved', id, this.logger.ts(ts));
                    resolve();
                };
                req.onerror = () => {
                    this.logger.error('Error saving to cache', id, req.error);
                    reject(req.error);
                };
            } catch (e) {
                this.logger.error('Error saving to cache', id, e);
                reject(e);
            }
        });
    }

    async load(id: string): Promise<ArrayBuffer> {
        this.logger.debug('Load', id);
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            try {
                const ts = this.logger.ts();
                const req = db.transaction(['files'], 'readonly').objectStore('files').get(id);
                req.onsuccess = () => {
                    this.logger.debug('Loaded', id, this.logger.ts(ts));
                    if (!(req.result instanceof ArrayBuffer)) {
                        reject('Failed to read data from IndexedDB');
                    }
                    resolve(req.result);
                };
                req.onerror = () => {
                    this.logger.error('Error loading from cache', id, req.error);
                    reject(req.error);
                };
            } catch (e) {
                this.logger.error('Error loading from cache', id, e);
                reject(e);
            }
        });
    }

    async remove(id: string): Promise<void> {
        this.logger.debug('Remove', id);
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            try {
                const ts = this.logger.ts();
                const req = db.transaction(['files'], 'readwrite').objectStore('files').delete(id);
                req.onsuccess = () => {
                    this.logger.debug('Removed', id, this.logger.ts(ts));
                    resolve();
                };
                req.onerror = () => {
                    this.logger.error('Error removing from cache', id, req.error);
                    reject(req.error);
                };
            } catch (e) {
                this.logger.error('Error removing from cache', id, e);
                reject(e);
            }
        });
    }
}
