import * as kdbxweb from 'kdbxweb';
import { Model } from 'util/model';

export interface FileBackupConfig {
    enabled: boolean;
    storage: string;
    path: string;
    schedule: string;
}

export class FileInfo extends Model {
    id: string;
    name: string;
    storage?: string;
    path?: string;
    modified = false;
    editState?: kdbxweb.KdbxEditState;
    rev?: string;
    syncDate?: Date;
    openDate?: Date;
    keyFileName?: string;
    keyFileHash?: string;
    keyFilePath?: string;
    // opts?: StorageFileOptions; // TODO(ts): file storage options
    backup?: FileBackupConfig;
    // chalResp: null; // TODO(ts): yubikey
    encryptedPassword?: string;
    encryptedPasswordDate?: Date;

    constructor(values: FileInfo) {
        super();
        this.id = values.id;
        this.name = values.name;
        Object.assign(this, values);
    }
}
