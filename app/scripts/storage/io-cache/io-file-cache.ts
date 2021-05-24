import * as kdbxweb from 'kdbxweb';
import { Launcher } from 'comp/launcher';
import { IoCacheBase } from './io-cache-base';
import * as path from 'path';
import * as fs from 'fs';

export class IoFileCache extends IoCacheBase {
    private _basePath?: string;

    private async init() {
        if (this._basePath) {
            return Promise.resolve();
        }
        let basePath = await Launcher?.ipcRenderer.invoke('get-user-data-path');
        if (!basePath) {
            throw new Error('Failed to get user data path');
        }
        basePath = path.join(basePath, this.cacheName);
        try {
            await fs.promises.mkdir(basePath);
        } catch (err) {
            this.logger.error('Error creating plugin folder');
            throw err;
        }
        this._basePath = basePath;
    }

    private resolvePath(filePath: string): string {
        if (!this._basePath) {
            throw new Error('Not initialized');
        }
        return path.join(this._basePath, filePath);
    }

    async save(id: string, data: ArrayBuffer): Promise<void> {
        await this.init();
        this.logger.info('Save', id);
        const ts = this.logger.ts();
        const filePath = this.resolvePath(id);
        try {
            await fs.promises.writeFile(filePath, Buffer.from(data));
            this.logger.info('Saved', id, this.logger.ts(ts));
        } catch (e) {
            this.logger.error('Error saving file', id, e);
            throw e;
        }
    }

    async load(id: string): Promise<ArrayBuffer> {
        await this.init();
        this.logger.info('Load', id);
        const ts = this.logger.ts();
        const filePath = this.resolvePath(id);
        try {
            const data = await fs.promises.readFile(filePath);
            this.logger.info('Loaded', id, this.logger.ts(ts));
            return kdbxweb.ByteUtils.arrayToBuffer(data);
        } catch (e) {
            this.logger.error('Error loading file', id, e);
            throw e;
        }
    }

    async remove(id: string): Promise<void> {
        await this.init();
        this.logger.info('Remove', id);
        const ts = this.logger.ts();
        const filePath = this.resolvePath(id);
        try {
            await fs.promises.unlink(filePath);
            this.logger.info('Removed', id, this.logger.ts(ts));
        } catch (e) {
            this.logger.error('Error removing file', id, e);
            throw e;
        }
    }
}
