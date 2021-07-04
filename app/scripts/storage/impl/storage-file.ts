import * as kdbxweb from 'kdbxweb';
import { Launcher } from 'comp/launcher';
import { StorageBase } from 'storage/storage-base';
import {
    StorageFileData,
    StorageFileNotFoundError,
    StorageFileOptions,
    StorageFileStat,
    StorageFileWatcherCallback,
    StoragePathIsDirectoryError,
    StorageRevConflictError,
    StorageSaveResult
} from 'storage/types';
import * as fs from 'fs';
import * as NodePath from 'path';
import { Locale } from 'util/locale';

interface StorageFileWatcherCallbackItem {
    file: string;
    callback: StorageFileWatcherCallback;
}

interface StorageFileWatcher {
    fsWatcher: fs.FSWatcher;
    callbacks: StorageFileWatcherCallbackItem[];
}

const fileWatchers = new Map<string, StorageFileWatcher>();

class StorageFile extends StorageBase {
    constructor() {
        super({
            name: 'file',
            icon: 'hdd',
            system: true,
            backup: true
        });
    }

    get enabled(): boolean {
        return !!Launcher;
    }

    get locName(): string {
        return Locale.file;
    }

    async load(path: string): Promise<StorageFileData> {
        this._logger.info('Load', path);
        const ts = this._logger.ts();

        const data = await fs.promises.readFile(path);
        const stat = await fs.promises.stat(path);
        const rev = stat.mtime.getTime().toString();
        this._logger.info('Loaded', path, rev, this._logger.ts(ts));
        return {
            data: kdbxweb.ByteUtils.arrayToBuffer(data),
            rev
        };
    }

    async stat(path: string): Promise<StorageFileStat> {
        this._logger.info('Stat', path);
        const ts = this._logger.ts();

        try {
            const stat = await fs.promises.stat(path);
            this._logger.info('Stat done', path, this._logger.ts(ts));

            const rev = stat.mtime.getTime().toString();
            return { rev };
        } catch (e) {
            this._logger.error('Error stat local file', path, e);
            if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new StorageFileNotFoundError();
            } else {
                throw e;
            }
        }
    }

    async save(
        path: string,
        data: ArrayBuffer,
        opts?: StorageFileOptions,
        rev?: string
    ): Promise<StorageSaveResult> {
        this._logger.info('Save', path, rev);
        const ts = this._logger.ts();

        if (rev) {
            try {
                const stat = await fs.promises.stat(path);
                const fileRev = stat.mtime.getTime().toString();

                if (fileRev !== rev) {
                    this._logger.info('Save mtime differs', rev, fileRev);
                    throw new StorageRevConflictError(rev, fileRev);
                }
            } catch (err) {
                this._logger.error('Stat error', path, err);
                throw err;
            }
        }

        try {
            await fs.promises.writeFile(path, Buffer.from(data));
        } catch (e) {
            this._logger.error('Error writing local file', path, e);
            if ((e as NodeJS.ErrnoException).code === 'EISDIR') {
                throw new StoragePathIsDirectoryError();
            }
            throw e;
        }
        const stat = await fs.promises.stat(path);
        const newRev = stat.mtime.getTime().toString();

        this._logger.info('Saved', path, this._logger.ts(ts));

        return { rev: newRev };
    }

    async mkdir(path: string): Promise<void> {
        this._logger.info('Make dir', path);
        const ts = this._logger.ts();

        try {
            await fs.promises.mkdir(path);
            this._logger.info('Made dir', path, this._logger.ts(ts));
        } catch (err) {
            this._logger.error('Error making local dir', path, err);
            throw err;
        }
    }

    watch(path: string, callback: () => void): void {
        const dir = NodePath.dirname(path);
        if (!fileWatchers.has(dir) && !dir.startsWith('\\')) {
            this._logger.info('Watch dir', dir);
            try {
                const fsWatcher = fs.watch(path, { persistent: false });
                fsWatcher.on('change', this.fsWatcherChange.bind(this, dir));
                fileWatchers.set(dir, {
                    fsWatcher,
                    callbacks: []
                });
            } catch (e) {
                this._logger.warn('Error watching dir', e);
            }
        }

        const fsWatcher = fileWatchers.get(dir);
        if (fsWatcher) {
            fsWatcher.callbacks.push({
                file: NodePath.basename(path),
                callback
            });
        }
    }

    unwatch(path: string): void {
        const dir = NodePath.dirname(path);
        const file = NodePath.basename(path);
        const watcher = fileWatchers.get(dir);
        if (watcher) {
            const ix = watcher.callbacks.findIndex((cb) => cb.file === file);
            if (ix >= 0) {
                watcher.callbacks.splice(ix, 1);
            }
            if (!watcher.callbacks.length) {
                this._logger.info('Stop watch dir', dir);
                watcher.fsWatcher.close();
                fileWatchers.delete(dir);
            }
        }
    }

    private fsWatcherChange(dir: string, evt: Event, fileName: string) {
        const watcher = fileWatchers.get(dir);
        if (watcher) {
            watcher.callbacks.forEach((cb) => {
                if (cb.file === fileName && typeof cb.callback === 'function') {
                    this._logger.info('File changed', dir, evt, fileName);
                    cb.callback();
                }
            });
        }
    }

    list: undefined;
    remove: undefined;
    getPathForName: undefined;
    getOpenConfig: undefined;
    getSettingsConfig: undefined;
    applyConfig: undefined;
    applySetting: undefined;
}

export { StorageFile };
