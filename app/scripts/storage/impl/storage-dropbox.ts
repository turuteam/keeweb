import { StorageBase } from 'storage/storage-base';
import { Features } from 'util/features';
import { UrlFormat } from 'util/formatting/url-format';
import { DropboxApps } from 'const/cloud-storage-apps';
import { Locale } from 'util/locale';
import { AppSettingsModel } from 'models/app-settings-model';
import { HttpResponse } from 'comp/launcher/desktop-ipc';
import { noop } from 'util/fn';
import {
    HttpRequestError,
    StorageConfigFieldPassword,
    StorageConfigFieldSelect,
    StorageConfigFieldText,
    StorageFileData,
    StorageListItem,
    StorageFileOptions,
    StorageFileStat,
    StorageOAuthConfig,
    StorageOpenConfig,
    StorageSettingsConfig,
    StorageFileNotFoundError,
    StorageSaveResult
} from 'storage/types';

// https://www.dropbox.com/developers/documentation/http/documentation#oauth2-authorize

class StorageDropbox extends StorageBase {
    constructor() {
        super({
            name: 'dropbox',
            icon: 'dropbox',
            uipos: 20,
            backup: true
        });
    }

    get enabled(): boolean {
        return AppSettingsModel.dropbox;
    }

    private toFullPath(path: string) {
        const rootFolder = AppSettingsModel.dropboxFolder;
        if (rootFolder) {
            path = UrlFormat.fixSlashes('/' + rootFolder + '/' + path);
        }
        return path;
    }

    private toRelPath(path: string) {
        const rootFolder = AppSettingsModel.dropboxFolder;
        if (rootFolder) {
            const ix = path.toLowerCase().indexOf(rootFolder.toLowerCase());
            if (ix === 0) {
                path = path.substr(rootFolder.length);
            } else if (ix === 1) {
                path = path.substr(rootFolder.length + 1);
            }
            path = UrlFormat.fixSlashes('/' + path);
        }
        return path;
    }

    private fixConfigFolder(folder: string) {
        folder = folder.replace(/\\/g, '/').trim();
        if (folder[0] === '/') {
            folder = folder.substr(1);
        }
        return folder;
    }

    private getKey() {
        return AppSettingsModel.dropboxAppKey || DropboxApps.AppFolder.id;
    }

    private getSecret() {
        const key = this.getKey();
        if (key === DropboxApps.AppFolder.id) {
            return DropboxApps.AppFolder.secret;
        }
        if (key === DropboxApps.FullDropbox.id) {
            return DropboxApps.FullDropbox.secret;
        }
        return AppSettingsModel.dropboxSecret ?? null;
    }

    private isValidKey() {
        const key = this.getKey();
        const isBuiltIn = key === DropboxApps.AppFolder.id || key === DropboxApps.FullDropbox.id;
        return key && key.indexOf(' ') < 0 && (!isBuiltIn || this.canUseBuiltInKeys());
    }

    private canUseBuiltInKeys() {
        return !Features.isSelfHosted;
    }

    protected getOAuthConfig(): StorageOAuthConfig {
        return {
            scope: 'files.content.read files.content.write files.metadata.read files.metadata.write',
            url: 'https://www.dropbox.com/oauth2/authorize',
            tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
            clientId: this.getKey(),
            clientSecret: this.getSecret(),
            pkce: true,
            width: 600,
            height: 400,
            urlParams: AppSettingsModel.shortLivedStorageToken
                ? {}
                : { 'token_access_type': 'offline' }
        };
    }

    needShowOpenConfig(): boolean {
        return !this.isValidKey() || !this.getSecret();
    }

    getOpenConfig(): StorageOpenConfig {
        const keyField: StorageConfigFieldText = {
            id: 'key',
            title: 'dropboxAppKey',
            desc: 'dropboxAppKeyDesc',
            type: 'text',
            required: true,
            pattern: '\\w+'
        };
        const secretField: StorageConfigFieldPassword = {
            id: 'secret',
            title: 'dropboxAppSecret',
            desc: 'dropboxAppSecretDesc',
            type: 'password',
            required: true,
            pattern: '\\w+'
        };
        const folderField: StorageConfigFieldText = {
            id: 'folder',
            title: 'dropboxFolder',
            desc: 'dropboxFolderDesc',
            type: 'text',
            placeholder: 'dropboxFolderPlaceholder'
        };
        return {
            desc: 'dropboxSetupDesc',
            fields: [keyField, secretField, folderField]
        };
    }

    getSettingsConfig(): StorageSettingsConfig {
        const fields = [];
        const appKey = this.getKey();
        const linkField: StorageConfigFieldSelect = {
            id: 'link',
            title: 'dropboxLink',
            type: 'select',
            value: 'custom',
            options: { app: 'dropboxLinkApp', full: 'dropboxLinkFull', custom: 'dropboxLinkCustom' }
        };
        const keyField: StorageConfigFieldText = {
            id: 'key',
            title: 'dropboxAppKey',
            desc: 'dropboxAppKeyDesc',
            type: 'text',
            required: true,
            pattern: '\\w+',
            value: appKey
        };
        const secretField: StorageConfigFieldPassword = {
            id: 'secret',
            title: 'dropboxAppSecret',
            desc: 'dropboxAppSecretDesc',
            type: 'password',
            required: true,
            pattern: '\\w+',
            value: AppSettingsModel.dropboxSecret ?? ''
        };
        const folderField: StorageConfigFieldText = {
            id: 'folder',
            title: 'dropboxFolder',
            desc: 'dropboxFolderSettingsDesc',
            type: 'text',
            value: AppSettingsModel.dropboxFolder ?? ''
        };
        const canUseBuiltInKeys = this.canUseBuiltInKeys();
        if (canUseBuiltInKeys) {
            fields.push(linkField);
            if (appKey === DropboxApps.AppFolder.id) {
                linkField.value = 'app';
            } else if (appKey === DropboxApps.FullDropbox.id) {
                linkField.value = 'full';
                fields.push(folderField);
            } else {
                fields.push(keyField);
                fields.push(secretField);
                fields.push(folderField);
            }
        } else {
            fields.push(keyField);
            fields.push(secretField);
            fields.push(folderField);
        }
        return { fields };
    }

    applyConfig(config: Record<string, string | null>): Promise<void> {
        if (config.key === DropboxApps.AppFolder.id || config.key === DropboxApps.FullDropbox.id) {
            throw new Error('Bad key');
        }
        // TODO: try to connect using new key
        if (config.folder) {
            config.folder = this.fixConfigFolder(config.folder);
        }
        AppSettingsModel.batchSet(() => {
            AppSettingsModel.dropboxAppKey = config.key;
            AppSettingsModel.dropboxSecret = config.secret;
            AppSettingsModel.dropboxFolder = config.folder;
        });
        return Promise.resolve();
    }

    applySetting(key: string, value: string): void {
        switch (key) {
            case 'link':
                switch (value) {
                    case 'app':
                        AppSettingsModel.dropboxAppKey = DropboxApps.AppFolder.id;
                        break;
                    case 'full':
                        AppSettingsModel.dropboxAppKey = DropboxApps.FullDropbox.id;
                        break;
                    case 'custom':
                        AppSettingsModel.dropboxAppKey = `(${Locale.dropboxAppKeyHint})`;
                        break;
                    default:
                        return;
                }
                this.logout().catch(noop);
                break;
            case 'key':
                AppSettingsModel.dropboxAppKey = value;
                this.logout().catch(noop);
                break;
            case 'secret':
                AppSettingsModel.dropboxSecret = value;
                this.logout().catch(noop);
                break;
            case 'folder':
                AppSettingsModel.dropboxFolder = this.fixConfigFolder(value);
                break;
        }
    }

    getPathForName(fileName: string): string {
        return '/' + fileName + '.kdbx';
    }

    private encodeJsonHttpHeader(json: string): string {
        return json.replace(
            /[\u007f-\uffff]/g,
            (c) => '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4)
        );
    }

    private async apiCall(args: {
        method: string;
        host?: string;
        data?: string | ArrayBuffer;
        apiArg?: Record<string, unknown>;
        statuses?: number[];
        responseType?: XMLHttpRequestResponseType;
    }): Promise<HttpResponse> {
        await this.oauthAuthorize();
        const host = args.host || 'api';
        const headers: Record<string, string> = {};
        const data = args.data;
        let dataType;
        if (args.apiArg) {
            headers['Dropbox-API-Arg'] = this.encodeJsonHttpHeader(JSON.stringify(args.apiArg));
        } else if (typeof data === 'string') {
            dataType = 'application/json';
        }
        try {
            return await this.xhr({
                url: `https://${host}.dropboxapi.com/2/${args.method}`,
                method: 'POST',
                responseType: args.responseType || 'json',
                headers,
                data,
                dataType,
                statuses: args.statuses
            });
        } catch (e) {
            const errData = e as Record<string, unknown>;
            if (errData.path && typeof errData.path === 'object') {
                const pathData = errData.path as Record<string, unknown>;
                if (pathData['.tag'] === 'not_found') {
                    this._logger.debug('File not found', args.method);
                    throw new StorageFileNotFoundError();
                }
            }
            const status = e instanceof HttpRequestError ? e.status : 0;
            this._logger.error('API error', args.method, status, e);
            throw new Error(`API error, status code ${status}`);
        }
    }

    async load(path: string): Promise<StorageFileData> {
        this._logger.debug('Load', path);
        const ts = this._logger.ts();
        path = this.toFullPath(path);
        const response = await this.apiCall({
            method: 'files/download',
            host: 'content',
            apiArg: { path },
            responseType: 'arraybuffer'
        });

        if (!(response.data instanceof ArrayBuffer)) {
            throw new Error('Response is not an ArrayBuffer');
        }

        const statStr = response.headers['dropbox-api-result'];
        if (!statStr) {
            throw new Error('No dropbox-api-result header');
        }

        const stat = JSON.parse(statStr) as Record<string, unknown>;
        const rev = typeof stat.rev === 'string' ? stat.rev : undefined;

        this._logger.debug('Loaded', path, rev, this._logger.ts(ts));

        return { data: response.data, rev };
    }

    async stat(path: string): Promise<StorageFileStat> {
        this._logger.debug('Stat', path);
        const ts = this._logger.ts();
        path = this.toFullPath(path);

        const result = await this.apiCall({
            method: 'files/get_metadata',
            data: JSON.stringify({ path })
        });

        const rec = result.data as Record<string, unknown>;
        const tag = rec['.tag'];

        if (typeof tag !== 'string') {
            throw new Error('.tag not found in response');
        }

        let stat: StorageFileStat;
        if (tag === 'file') {
            if (typeof rec.rev === 'string') {
                stat = { rev: rec.rev };
            } else {
                stat = {};
            }
        } else if (tag === 'folder') {
            stat = { folder: true };
        } else {
            throw new Error(`Bad .tag: ${tag}`);
        }

        this._logger.debug(
            'Stat complete',
            path,
            stat.folder ? 'folder' : stat.rev,
            this._logger.ts(ts)
        );
        return stat;
    }

    async save(
        path: string,
        data: ArrayBuffer,
        opts?: StorageFileOptions,
        rev?: string
    ): Promise<StorageSaveResult> {
        this._logger.debug('Save', path, rev);
        const ts = this._logger.ts();
        path = this.toFullPath(path);
        const arg = {
            path,
            mode: rev ? { '.tag': 'update', update: rev } : { '.tag': 'overwrite' }
        };
        const result = await this.apiCall({
            method: 'files/upload',
            host: 'content',
            apiArg: arg,
            data,
            responseType: 'json'
        });

        const stat = result.data as Record<string, unknown>;
        const savedRev = typeof stat.rev === 'string' ? stat.rev : undefined;

        this._logger.debug('Saved', path, savedRev, this._logger.ts(ts));
        return { rev: savedRev };
    }

    async remove(path: string): Promise<void> {
        this._logger.debug('Remove', path);
        const ts = this._logger.ts();
        path = this.toFullPath(path);
        await this.apiCall({
            method: 'files/delete',
            data: JSON.stringify({ path })
        });
        this._logger.debug('Removed', path, this._logger.ts(ts));
    }

    async list(dir: string): Promise<StorageListItem[]> {
        this._logger.debug('List');
        const ts = this._logger.ts();
        const response = await this.apiCall({
            method: 'files/list_folder',
            data: JSON.stringify({
                path: this.toFullPath(dir || ''),
                recursive: false
            })
        });

        const data = response.data as Record<string, unknown>;

        if (!Array.isArray(data?.entries)) {
            throw new Error('Empty response');
        }

        this._logger.debug('Listed', this._logger.ts(ts));

        const result: StorageListItem[] = [];
        for (const ent of data.entries) {
            const entry = ent as Record<string, unknown>;
            if (typeof entry.name !== 'string') {
                continue;
            }
            if (typeof entry.path_display !== 'string') {
                continue;
            }
            if (entry.rev !== undefined && typeof entry.rev !== 'string') {
                continue;
            }

            result.push({
                name: entry.name,
                path: this.toRelPath(entry.path_display),
                rev: entry.rev,
                dir: entry['.tag'] !== 'file'
            });
        }
        return result;
    }

    async mkdir(path: string): Promise<void> {
        this._logger.debug('Make dir', path);
        const ts = this._logger.ts();
        path = this.toFullPath(path);
        await this.apiCall({
            method: 'files/create_folder',
            data: JSON.stringify({ path })
        });
        this._logger.debug('Made dir', path, this._logger.ts(ts));
    }

    async logout(): Promise<void> {
        await this.oauthRevokeToken('https://api.dropboxapi.com/2/auth/token/revoke', true);
    }

    watch: undefined;
    unwatch: undefined;
}

export { StorageDropbox };
