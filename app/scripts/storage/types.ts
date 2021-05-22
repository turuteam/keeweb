export interface StorageFileOptions {
    username?: string;
}

export class HttpRequestError extends Error {
    readonly status: number;

    constructor(status: number) {
        super(`HTTP status ${status}`);
        this.status = status;
    }
}

export class StorageFileNotFoundError extends Error {
    constructor() {
        super('File not found');
    }
}

export class StoragePathIsDirectoryError extends Error {
    constructor() {
        super('Requested path is a directory');
    }
}

export class StorageRevConflictError extends Error {
    readonly localRev: string;
    readonly storageRev: string;

    constructor(localRev: string, storageRev: string) {
        super('Rev conflict');
        this.localRev = localRev;
        this.storageRev = storageRev;
    }
}

export interface StorageOAuthConfig {
    scope: string;
    url: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string | null;
    pkce: boolean;
    width: number;
    height: number;
    urlParams: Record<string, string>;
}

export interface StorageFileData {
    data: ArrayBuffer;
    rev?: string;
}

export interface StorageFileStat {
    rev?: string;
    folder?: boolean;
}

export interface StorageConfigField {
    type: string;
    id: string;
    title: string;
    desc?: string;
    required?: boolean;
    value?: string;
}

export interface StorageConfigFieldText extends StorageConfigField {
    type: 'text';
    pattern?: string;
    placeholder?: string;
    value?: string;
}

export interface StorageConfigFieldPassword extends StorageConfigField {
    type: 'password';
    pattern?: string;
    placeholder?: string;
    value?: string;
}

export interface StorageConfigFieldSelect extends StorageConfigField {
    type: 'select';
    options: Record<string, string>;
    value?: string;
}

export interface StorageOpenConfig {
    desc: string;
    fields: StorageConfigField[];
}

export interface StorageSettingsConfig {
    fields: StorageConfigField[];
}

export interface StorageListItem {
    name: string;
    path: string;
    rev?: string;
    dir?: boolean;
}

export type StorageFileWatcherCallback = () => void;
