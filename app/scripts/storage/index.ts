import { Launcher } from 'comp/launcher';
import { StorageCache } from 'storage/impl/storage-cache';
import { StorageDropbox } from 'storage/impl/storage-dropbox';
import { StorageFile } from 'storage/impl/storage-file';
import { StorageFileCache } from 'storage/impl/storage-file-cache';
import { StorageGDrive } from 'storage/impl/storage-gdrive';
import { StorageOneDrive } from 'storage/impl/storage-onedrive';
import { StorageWebDav } from 'storage/impl/storage-webdav';
import { createOAuthSession } from 'storage/pkce';
import { StorageBase } from './storage-base';

const Storage = {
    file: new StorageFile(),
    cache: Launcher ? new StorageFileCache() : new StorageCache(),
    dropbox: new StorageDropbox(),
    gdrive: new StorageGDrive(),
    onedrive: new StorageOneDrive(),
    webdav: new StorageWebDav(),

    get(name: string): StorageBase | undefined {
        const allStorages = Storage as Record<string, unknown>;
        const storage = allStorages[name];
        return storage instanceof StorageBase ? storage : undefined;
    }
};

requestAnimationFrame(createOAuthSession);

export { Storage };
