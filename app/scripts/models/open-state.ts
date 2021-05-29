import * as kdbxweb from 'kdbxweb';
import { Model } from 'util/model';
import { StorageFileOptions } from 'storage/types';
import { FileChalRespConfig } from 'models/file-info';

export class OpenState extends Model {
    name?: string;
    password?: kdbxweb.ProtectedValue;
    id?: string;
    storage?: string;
    path?: string;
    keyFileName?: string;
    keyFileData?: Uint8Array;
    keyFilePath?: string;
    fileData?: Uint8Array;
    rev?: string;
    opts?: StorageFileOptions;
    chalResp?: FileChalRespConfig;

    busy = false;
    secondRowVisible = false;
}
