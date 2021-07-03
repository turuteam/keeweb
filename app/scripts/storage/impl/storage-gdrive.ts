import { StorageBase } from 'storage/storage-base';
import { Locale } from 'util/locale';
import { Features } from 'util/features';
import { UrlFormat } from 'util/formatting/url-format';
import { GDriveApps } from 'const/cloud-storage-apps';
import { AppSettings } from 'models/app-settings';
import {
    StorageFileData,
    StorageFileNotFoundError,
    StorageFileOptions,
    StorageFileStat,
    StorageListItem,
    StorageOAuthConfig,
    StorageRevConflictError,
    StorageSaveResult
} from 'storage/types';
import { HttpRequestMultipartDataItem } from 'comp/launcher/desktop-ipc';

// https://developers.google.com/identity/protocols/oauth2/web-server

const NewFileIdPrefix = 'NewFile:';
const BaseUrl = 'https://www.googleapis.com/drive/v3';
const BaseUrlUpload = 'https://www.googleapis.com/upload/drive/v3';

class StorageGDrive extends StorageBase {
    constructor() {
        super({
            name: 'gdrive',
            uipos: 30,
            icon: 'google-drive'
        });
    }

    get enabled(): boolean {
        return AppSettings.gdrive;
    }

    getPathForName(fileName: string): string {
        return NewFileIdPrefix + fileName;
    }

    async load(path: string): Promise<StorageFileData> {
        const stat = await this.stat(path);
        if (!stat.rev) {
            throw new Error('Empty rev');
        }

        this._logger.info('Load', path);

        const ts = this._logger.ts();
        const url = UrlFormat.makeUrl(`${BaseUrl}/files/${path}/revisions/${stat.rev}`, {
            'alt': 'media'
        });

        let data: ArrayBuffer;
        try {
            const response = await this.xhr({
                url,
                responseType: 'arraybuffer'
            });
            if (!(response.data instanceof ArrayBuffer)) {
                throw new Error('Expected ArrayBuffer');
            }
            data = response.data;
        } catch (err) {
            this._logger.error('Load error', path, err, this._logger.ts(ts));
            throw err;
        }

        this._logger.info('Loaded', path, stat.rev, this._logger.ts(ts));
        return { data, rev: stat.rev };
    }

    async stat(path: string): Promise<StorageFileStat> {
        if (path.lastIndexOf(NewFileIdPrefix, 0) === 0) {
            throw new StorageFileNotFoundError();
        }
        await this.oauthAuthorize();
        this._logger.info('Stat', path);
        const ts = this._logger.ts();
        const url = UrlFormat.makeUrl(`${BaseUrl}/files/${path}`, {
            fields: 'headRevisionId',
            includeItemsFromAllDrives: 'true',
            supportsAllDrives: 'true'
        });

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
            this._logger.error('Stat error', this._logger.ts(ts), err);
            throw err;
        }

        if (
            typeof responseData.headRevisionId !== 'string' &&
            responseData.headRevisionId !== undefined
        ) {
            throw new Error('Bad headRevisionId');
        }

        const rev = responseData.headRevisionId;
        this._logger.info('Stat done', path, rev, this._logger.ts(ts));

        return { rev };
    }

    async save(
        path: string,
        data: ArrayBuffer,
        opts?: StorageFileOptions,
        rev?: string
    ): Promise<StorageSaveResult> {
        await this.oauthAuthorize();

        const stat = await this.stat(path);
        if (rev && stat.rev !== rev) {
            throw new StorageRevConflictError(rev, stat.rev ?? '');
        }

        this._logger.info('Save', path);

        const ts = this._logger.ts();
        const isNew = path.lastIndexOf(NewFileIdPrefix, 0) === 0;
        let url;
        let dataType;
        let multipartData: HttpRequestMultipartDataItem[] | undefined;
        if (isNew) {
            url = UrlFormat.makeUrl(`${BaseUrlUpload}/files`, {
                uploadType: 'multipart',
                fields: 'id,headRevisionId',
                includeItemsFromAllDrives: 'true',
                supportsAllDrives: 'true'
            });
            const fileName = path.replace(NewFileIdPrefix, '') + '.kdbx';
            const rand = Math.round(Math.random() * 1000000);
            const boundary = `b${Date.now()}x${rand}`;
            multipartData = [
                '--',
                boundary,
                '\r\n',
                'Content-Type: application/json; charset=UTF-8',
                '\r\n\r\n',
                JSON.stringify({ name: fileName }),
                '\r\n',
                '--',
                boundary,
                '\r\n',
                'Content-Type: application/octet-stream',
                '\r\n\r\n',
                data,
                '\r\n',
                '--',
                boundary,
                '--',
                '\r\n'
            ];
            dataType = 'multipart/related; boundary="' + boundary + '"';
        } else {
            url = UrlFormat.makeUrl(`${BaseUrlUpload}/files/${path}`, {
                uploadType: 'media',
                fields: 'headRevisionId',
                includeItemsFromAllDrives: 'true',
                supportsAllDrives: 'true'
            });
        }

        let responseData: Record<string, unknown>;
        try {
            const response = await this.xhr({
                url,
                method: isNew ? 'POST' : 'PATCH',
                responseType: 'json',
                data: multipartData ? undefined : data,
                multipartData,
                dataType
            });

            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Bad response');
            }
            responseData = response.data as Record<string, unknown>;
        } catch (err) {
            this._logger.error('Save error', path, err, this._logger.ts(ts));
            throw err;
        }

        this._logger.info('Saved', path, this._logger.ts(ts));

        const newRev = responseData.headRevisionId;
        if (typeof newRev !== 'string' || !newRev) {
            throw new Error('Save error: no rev');
        }

        let newPath: string | undefined;
        if (isNew) {
            if (typeof responseData.id !== 'string') {
                throw new Error('Empty id in response');
            }
            newPath = responseData.id;
        }

        return { rev: newRev, path: newPath };
    }

    async list(dir?: string): Promise<StorageListItem[]> {
        await this.oauthAuthorize();

        this._logger.info('List');

        const ts = this._logger.ts();

        if (dir === 'drives') {
            const url = UrlFormat.makeUrl(`${BaseUrl}/drives`, {
                pageSize: '100'
            });

            let responseData: Record<string, unknown>;
            try {
                const response = await this.xhr({
                    url,
                    responseType: 'json'
                });
                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Empty data');
                }
                responseData = response.data as Record<string, unknown>;
            } catch (err) {
                this._logger.error('Drive list error', this._logger.ts(ts), err);
                throw err;
            }

            this._logger.info('Listed drives', this._logger.ts(ts));

            if (!Array.isArray(responseData.drives)) {
                throw new Error('Empty drives');
            }

            const result: StorageListItem[] = [];

            for (const item of responseData.drives) {
                if (!item || typeof item !== 'object') {
                    continue;
                }
                const rec = item as Record<string, unknown>;
                if (!rec.name || typeof rec.name !== 'string') {
                    continue;
                }
                if (!rec.id || typeof rec.id !== 'string') {
                    continue;
                }

                result.push({
                    name: rec.name,
                    path: rec.id,
                    dir: true
                });
            }

            return result;
        } else {
            let query = 'trashed=false and ';
            if (dir === 'shared') {
                query += 'sharedWithMe=true';
            } else if (dir) {
                query += `"${dir}" in parents`;
            } else {
                query += '"root" in parents';
            }

            const url = UrlFormat.makeUrl(`${BaseUrl}/files`, {
                fields: 'files(id,name,mimeType,headRevisionId)',
                q: query,
                pageSize: '1000',
                includeItemsFromAllDrives: 'true',
                supportsAllDrives: 'true'
            });

            let responseData: Record<string, unknown>;
            try {
                const response = await this.xhr({
                    url,
                    responseType: 'json'
                });
                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Empty data');
                }
                responseData = response.data as Record<string, unknown>;
            } catch (err) {
                this._logger.error('List error', this._logger.ts(ts), err);
                throw err;
            }

            this._logger.info('Listed', this._logger.ts(ts));

            if (!Array.isArray(responseData.files)) {
                throw new Error('Empty files');
            }

            const result: StorageListItem[] = [];

            for (const item of responseData.files) {
                if (!item || typeof item !== 'object') {
                    continue;
                }
                const rec = item as Record<string, unknown>;
                if (!rec.name || typeof rec.name !== 'string') {
                    continue;
                }
                if (!rec.id || typeof rec.id !== 'string') {
                    continue;
                }
                if (rec.headRevisionId !== undefined && typeof rec.headRevisionId !== 'string') {
                    continue;
                }

                result.push({
                    name: rec.name,
                    path: rec.id,
                    rev: rec.headRevisionId,
                    dir: rec.mimeType === 'application/vnd.google-apps.folder'
                });
            }

            if (!dir) {
                result.unshift({
                    name: Locale.gdriveSharedWithMe,
                    path: 'shared',
                    rev: undefined,
                    dir: true
                });
                result.unshift({
                    name: Locale.gdriveSharedDrives,
                    path: 'drives',
                    rev: undefined,
                    dir: true
                });
            }

            return result;
        }
    }

    async remove(path: string): Promise<void> {
        this._logger.info('Remove', path);
        const ts = this._logger.ts();
        const url = `${BaseUrl}/files/${path}`;
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
        this._logger.info('Removed', path, this._logger.ts(ts));
    }

    async logout(): Promise<void> {
        await this.oauthRevokeToken('https://accounts.google.com/o/oauth2/revoke?token={token}');
    }

    protected getOAuthConfig(): StorageOAuthConfig {
        let clientId = AppSettings.gdriveClientId;
        let clientSecret = AppSettings.gdriveClientSecret;
        if (!clientId || !clientSecret) {
            if (Features.isDesktop) {
                ({ id: clientId, secret: clientSecret } = GDriveApps.Desktop);
            } else if (Features.isLocal) {
                ({ id: clientId, secret: clientSecret } = GDriveApps.Local);
            } else {
                ({ id: clientId, secret: clientSecret } = GDriveApps.Production);
            }
        }
        return {
            scope: 'https://www.googleapis.com/auth/drive',
            url: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            clientId,
            clientSecret,
            width: 600,
            height: 400,
            pkce: true,
            urlParams: AppSettings.shortLivedStorageToken ? {} : { 'access_type': 'offline' }
        };
    }

    mkdir: undefined;
    watch: undefined;
    unwatch: undefined;
}

export { StorageGDrive };
