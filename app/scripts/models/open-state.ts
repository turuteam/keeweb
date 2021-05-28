import { Model } from 'util/model';
import { StorageFileOptions } from 'storage/types';
import { FileChalRespConfig } from 'models/file-info';

export interface OpenParams {
    name?: string;
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
}

export class OpenState extends Model {
    params: OpenParams = {};
    secondRowVisible = false;
}
