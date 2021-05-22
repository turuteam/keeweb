import { StorageBase } from 'storage/storage-base';
import { OneDriveApps } from 'const/cloud-storage-apps';
import { Features } from 'util/features';
import { AppSettingsModel } from 'models/app-settings-model';
import {
    HttpRequestError,
    StorageFileData,
    StorageFileNotFoundError,
    StorageFileOptions,
    StorageFileStat,
    StorageListItem,
    StorageOAuthConfig,
    StorageRevConflictError,
    StorageSaveResult
} from 'storage/types';

// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

const BaseUrl = 'https://graph.microsoft.com/v1.0/me';

class StorageOneDrive extends StorageBase {
    constructor() {
        super({
            name: 'onedrive',
            uipos: 40,
            icon: 'onedrive'
        });
    }

    get enabled(): boolean {
        return AppSettingsModel.onedrive;
    }

    getPathForName(fileName: string): string {
        return '/drive/root:/' + fileName + '.kdbx';
    }

    async load(path: string): Promise<StorageFileData> {
        await this.oauthAuthorize();
        this._logger.debug('Load', path);
        const ts = this._logger.ts();
        const url = BaseUrl + path;

        let responseData: Record<string, unknown>;
        try {
            const response = await this.xhr({
                url,
                responseType: 'json'
            });
            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Bad response');
            }
            responseData = response.data as Record<string, unknown>;
        } catch (err) {
            this._logger.error('Load error', path, err, this._logger.ts(ts));
            throw err;
        }

        const downloadUrl = responseData['@microsoft.graph.downloadUrl'];

        if (typeof downloadUrl !== 'string') {
            this._logger.debug(
                'Load error',
                path,
                'no download url',
                responseData,
                this._logger.ts(ts)
            );
            throw new Error('No download url');
        }

        if (typeof responseData.eTag !== 'string') {
            this._logger.debug('Load error', path, 'no rev', responseData, this._logger.ts(ts));
            throw new Error('No rev');
        }

        let rev = responseData.eTag;

        let data: ArrayBuffer;
        try {
            const response = await this.xhr({
                url: downloadUrl,
                responseType: 'arraybuffer',
                skipAuth: true
            });

            if (!(response.data instanceof ArrayBuffer)) {
                throw new Error('Bad response');
            }

            data = response.data;

            if (response.headers.ETag) {
                rev = response.headers.ETag;
            }
        } catch (err) {
            this._logger.error('Load error', path, err, this._logger.ts(ts));
            throw err;
        }

        this._logger.debug('Loaded', path, rev, this._logger.ts(ts));

        return { data, rev };
    }

    async stat(path: string): Promise<StorageFileStat> {
        await this.oauthAuthorize();
        this._logger.debug('Stat', path);
        const ts = this._logger.ts();
        const url = BaseUrl + path;

        let responseData: Record<string, unknown>;
        try {
            const response = await this.xhr({
                url,
                responseType: 'json'
            });

            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Bad response');
            }
            responseData = response.data as Record<string, unknown>;
        } catch (err) {
            if (err instanceof HttpRequestError && err.status === 404) {
                this._logger.debug('Stat error: not found', path, this._logger.ts(ts));
                throw new StorageFileNotFoundError();
            }
            this._logger.error('Stat error', path, err, this._logger.ts(ts));
            throw err;
        }

        const rev = responseData.eTag;
        if (typeof rev !== 'string' || !rev) {
            this._logger.error('Stat error', path, 'no eTag', this._logger.ts(ts));
            throw new Error('No eTag');
        }

        this._logger.debug('Stat done', path, rev, this._logger.ts(ts));
        return { rev };
    }

    async save(
        path: string,
        data: ArrayBuffer,
        opts?: StorageFileOptions,
        rev?: string
    ): Promise<StorageSaveResult> {
        await this.oauthAuthorize();
        this._logger.debug('Save', path, rev);
        const ts = this._logger.ts();
        const url = BaseUrl + path + ':/content';

        let responseData: Record<string, unknown>;
        let status: number;

        try {
            const response = await this.xhr({
                url,
                method: 'PUT',
                responseType: 'json',
                headers: rev ? { 'If-Match': rev } : undefined,
                data,
                statuses: [200, 201, 412]
            });

            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Bad response');
            }
            responseData = response.data as Record<string, unknown>;
            status = response.status;
        } catch (err) {
            this._logger.error('Save error', path, err, this._logger.ts(ts));
            throw err;
        }

        const storageRev = responseData.eTag;
        if (!storageRev || typeof storageRev !== 'string') {
            this._logger.error('Save error', path, 'no eTag', this._logger.ts(ts));
            throw new Error('No eTag');
        }
        if (status === 412) {
            this._logger.debug('Save conflict', path, storageRev, this._logger.ts(ts));
            throw new StorageRevConflictError(rev ?? '', storageRev);
        }
        this._logger.debug('Saved', path, rev, this._logger.ts(ts));
        return { rev: storageRev };
    }

    async list(dir: string): Promise<StorageListItem[]> {
        await this.oauthAuthorize();
        this._logger.debug('List');
        const ts = this._logger.ts();
        const url = BaseUrl + (dir ? `${dir}:/children` : '/drive/root/children');

        let responseData: Record<string, unknown>;

        try {
            const response = await this.xhr({
                url,
                responseType: 'json'
            });

            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Bad response');
            }
            responseData = response.data as Record<string, unknown>;
        } catch (err) {
            this._logger.error('List error', this._logger.ts(ts), err);
            throw err;
        }

        if (!Array.isArray(responseData.value)) {
            this._logger.error('List error', this._logger.ts(ts), responseData);
            throw new Error('List error');
        }
        this._logger.debug('Listed', this._logger.ts(ts));

        const result: StorageListItem[] = [];
        for (const item of responseData.value) {
            if (!item || typeof item !== 'object') {
                continue;
            }
            const rec = item as Record<string, unknown>;
            if (typeof rec.name !== 'string' || !rec.name) {
                continue;
            }
            if (typeof rec.parentReference !== 'object' || !rec.parentReference) {
                continue;
            }
            const parentReference = rec.parentReference as Record<string, unknown>;
            if (typeof parentReference.path !== 'string' || !parentReference.path) {
                continue;
            }
            if (typeof rec.eTag !== 'string' && rec.eTag !== undefined && rec.eTag !== null) {
                continue;
            }

            result.push({
                name: rec.name,
                path: parentReference.path + '/' + rec.name,
                rev: rec.eTag ?? undefined,
                dir: !!rec.folder
            });
        }
        return result;
    }

    async remove(path: string): Promise<void> {
        this._logger.debug('Remove', path);
        const ts = this._logger.ts();
        const url = BaseUrl + path;

        try {
            await this.xhr({
                url,
                method: 'DELETE',
                responseType: 'json',
                statuses: [200, 204]
            });
        } catch (err) {
            this._logger.error('Remove error', path, err, this._logger.ts(ts));
            throw err;
        }
        this._logger.debug('Removed', path, this._logger.ts(ts));
    }

    async mkdir(path: string): Promise<void> {
        await this.oauthAuthorize();
        this._logger.debug('Make dir', path);
        const ts = this._logger.ts();
        const url = BaseUrl + '/drive/root/children';
        const data = JSON.stringify({ name: path.replace('/drive/root:/', ''), folder: {} });

        try {
            await this.xhr({
                url,
                method: 'POST',
                responseType: 'json',
                statuses: [200, 204],
                data,
                dataType: 'application/json'
            });
        } catch (err) {
            this._logger.error('Make dir error', path, err, this._logger.ts(ts));
            throw err;
        }

        this._logger.debug('Made dir', path, this._logger.ts(ts));
    }

    async logout(): Promise<void> {
        await this.oauthRevokeToken();
    }

    protected getOAuthConfig(): StorageOAuthConfig {
        let clientId = AppSettingsModel.onedriveClientId;
        let clientSecret = AppSettingsModel.onedriveClientSecret;
        if (!clientId) {
            if (Features.isDesktop) {
                ({ id: clientId, secret: clientSecret } = OneDriveApps.Desktop);
            } else if (Features.isLocal) {
                ({ id: clientId, secret: clientSecret } = OneDriveApps.Local);
            } else {
                ({ id: clientId, secret: clientSecret } = OneDriveApps.Production);
            }
        }
        let scope = 'files.readwrite';
        if (!AppSettingsModel.shortLivedStorageToken) {
            scope += ' offline_access';
        }
        return {
            url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            scope,
            clientId,
            clientSecret,
            pkce: true,
            width: 600,
            height: 500,
            urlParams: {}
        };
    }

    watch: undefined;
    unwatch: undefined;
}

export { StorageOneDrive };
