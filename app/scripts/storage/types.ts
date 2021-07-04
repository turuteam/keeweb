export interface StorageFileOptions {
    user?: string;
    password?: string;
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

export class BrowserAuthStartedError extends Error {
    constructor() {
        super('Browser auth started');
    }
}

export class OAuthRejectedError extends Error {
    constructor(message: string) {
        super(`OAuth error: ${message}`);
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

export interface StorageSaveResult {
    rev?: string;
    path?: string;
}

export interface StorageConfigFieldBase {
    id: string;
    title: string;
    desc?: string;
    required?: boolean;
    value?: string | null;
}

export interface StorageConfigFieldText extends StorageConfigFieldBase {
    type: 'text';
    pattern?: string;
    placeholder?: string;
}

export interface StorageConfigFieldPassword extends StorageConfigFieldBase {
    type: 'password';
    pattern?: string;
    placeholder?: string;
}

export interface StorageConfigFieldSelect extends StorageConfigFieldBase {
    type: 'select';
    options: Record<string, string>;
}

export interface StorageConfigFieldCheckbox extends StorageConfigFieldBase {
    type: 'checkbox';
}

export type StorageConfigField =
    | StorageConfigFieldText
    | StorageConfigFieldPassword
    | StorageConfigFieldSelect
    | StorageConfigFieldCheckbox;

export interface StorageOpenConfig {
    desc?: string;
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
