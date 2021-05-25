import * as kdbxweb from 'kdbxweb';
import { StorageBase } from 'storage/storage-base';
import { Locale } from 'util/locale';
import { AppSettings } from 'models/app-settings';
import {
    HttpRequestError,
    StorageConfigFieldCheckbox,
    StorageConfigFieldPassword,
    StorageConfigFieldSelect,
    StorageConfigFieldText,
    StorageFileData,
    StorageFileNotFoundError,
    StorageFileOptions,
    StorageFileStat,
    StorageOpenConfig,
    StorageRevConflictError,
    StorageSaveResult,
    StorageSettingsConfig
} from 'storage/types';
import { noop } from 'util/fn';

class StorageWebDav extends StorageBase {
    constructor() {
        super({
            name: 'webdav',
            icon: 'server',
            uipos: 10
        });
    }

    get enabled(): boolean {
        return AppSettings.webdav;
    }

    needShowOpenConfig(): boolean {
        return true;
    }

    getOpenConfig(): StorageOpenConfig {
        const pathField: StorageConfigFieldText = {
            id: 'path',
            title: 'openUrl',
            desc: 'openUrlDesc',
            type: 'text',
            required: true,
            pattern: '^https://.+'
        };
        const userField: StorageConfigFieldText = {
            id: 'user',
            title: 'openUser',
            desc: 'openUserDesc',
            placeholder: 'openUserPlaceholder',
            type: 'text'
        };
        const passwordField: StorageConfigFieldPassword = {
            id: 'password',
            title: 'openPass',
            desc: 'openPassDesc',
            placeholder: 'openPassPlaceholder',
            type: 'password'
        };

        return {
            fields: [pathField, userField, passwordField]
        };
    }

    getSettingsConfig(): StorageSettingsConfig {
        const methodField: StorageConfigFieldSelect = {
            id: 'webdavSaveMethod',
            title: 'webdavSaveMethod',
            type: 'select',
            value: AppSettings.webdavSaveMethod,
            options: { default: 'webdavSaveMove', put: 'webdavSavePut' }
        };
        const reloadField: StorageConfigFieldCheckbox = {
            id: 'webdavStatReload',
            title: 'webdavStatReload',
            type: 'checkbox',
            value: AppSettings.webdavStatReload ? 'true' : null
        };

        return {
            fields: [methodField, reloadField]
        };
    }

    applySetting(key: string, value: string): void {
        switch (key) {
            case 'webdavSaveMethod':
                AppSettings.set('webdavSaveMethod', value);
                break;
            case 'webdavStatReload':
                AppSettings.webdavStatReload = !!value;
                break;
        }
    }

    async load(path: string, opts?: StorageFileOptions): Promise<StorageFileData> {
        return this.request({
            op: 'Load',
            method: 'GET',
            path,
            user: opts?.user,
            password: opts?.password,
            noStat: AppSettings.webdavStatReload,
            calcStat: AppSettings.webdavStatReload
        });
    }

    stat(path: string, opts?: StorageFileOptions): Promise<StorageFileStat> {
        return this.statRequest(path, opts, 'Stat');
    }

    private async statRequest(
        path: string,
        opts: StorageFileOptions | undefined,
        op: string
    ): Promise<StorageFileStat> {
        return this.request({
            op,
            method: 'GET',
            path,
            user: opts?.user,
            password: opts?.password,
            noStat: AppSettings.webdavStatReload,
            calcStat: AppSettings.webdavStatReload
        });
    }

    async save(
        path: string,
        data: ArrayBuffer,
        opts?: StorageFileOptions,
        rev?: string
    ): Promise<StorageSaveResult> {
        const tmpPath = path.replace(/[^\/]+$/, (m) => '.' + m) + `.${Date.now()}`;
        const saveOpts = {
            path,
            user: opts?.user,
            password: opts?.password
        };

        let stat: StorageFileStat = {};
        let useTmpPath = AppSettings.webdavSaveMethod !== 'put';
        try {
            stat = await this.statRequest(path, opts, 'Save:stat');
        } catch (err) {
            if (err instanceof StorageFileNotFoundError) {
                this._logger.info('Save: not found, creating');
                useTmpPath = false;
            } else {
                throw err;
            }
        }

        if (stat.rev !== rev) {
            this._logger.info('Save error', path, 'rev conflict', stat.rev, rev);
            throw new StorageRevConflictError(rev ?? '', stat.rev ?? '');
        }
        if (useTmpPath) {
            await this.request({
                ...saveOpts,
                op: 'Save:put',
                method: 'PUT',
                path: tmpPath,
                data,
                noStat: true
            });

            let stat: StorageFileStat;
            try {
                stat = await this.statRequest(path, opts, 'Save:stat');
            } catch (err) {
                try {
                    await this.request({
                        ...saveOpts,
                        op: 'Save:delete',
                        method: 'DELETE',
                        path: tmpPath
                    });
                } catch {}
                throw err;
            }

            if (stat.rev !== rev) {
                this._logger.info('Save error', path, 'rev conflict', stat.rev, rev);
                try {
                    await this.request({
                        ...saveOpts,
                        op: 'Save:delete',
                        method: 'DELETE',
                        path: tmpPath
                    });
                } catch {}
                throw new StorageRevConflictError(rev ?? '', stat.rev ?? '');
            }

            let movePath = path;
            if (movePath.indexOf('://') < 0) {
                if (movePath.indexOf('/') === 0) {
                    movePath = location.protocol + '//' + location.host + movePath;
                } else {
                    movePath = location.href.replace(/\?(.*)/, '').replace(/[^/]*$/, movePath);
                }
            }

            // prevent double encoding, see #1729
            const encodedMovePath = /%[A-Z0-9]{2}/.test(movePath) ? movePath : encodeURI(movePath);
            await this.request({
                ...saveOpts,
                op: 'Save:move',
                method: 'MOVE',
                path: tmpPath,
                noStat: true,
                headers: {
                    Destination: encodedMovePath,
                    'Overwrite': 'T'
                }
            });
            return await this.statRequest(path, opts, 'Save:stat');
        } else {
            await this.request({
                ...saveOpts,
                op: 'Save:put',
                method: 'PUT',
                data,
                noStat: true
            });

            return this.statRequest(path, opts, 'Save:stat');
        }
    }

    // TODO(ts): remove from here
    // fileOptsToStoreOpts(opts: StorageFileOptions, file: { uuid: string }) {
    //     const result = { user: opts.user, encpass: opts.encpass };
    //     if (opts.password) {
    //         const fileId = file.uuid;
    //         const password = opts.password;
    //         const encpass = this._xorString(password, fileId);
    //         result.encpass = btoa(encpass);
    //     }
    //     return result;
    // }
    //
    // storeOptsToFileOpts(opts, file: { uuid: string }): StorageFileOptions {
    //     const result = { user: opts.user, password: opts.password };
    //     if (opts.encpass) {
    //         const fileId = file.uuid;
    //         const encpass = atob(opts.encpass);
    //         result.password = this._xorString(encpass, fileId);
    //     }
    //     return result;
    // }
    //
    // private xorString(str: string, another: string): string {
    //     let result = '';
    //     for (let i = 0; i < str.length; i++) {
    //         const strCharCode = str.charCodeAt(i);
    //         const anotherIx = i % another.length;
    //         const anotherCharCode = another.charCodeAt(anotherIx);
    //         const resultCharCode = strCharCode ^ anotherCharCode;
    //         result += String.fromCharCode(resultCharCode);
    //     }
    //     return result;
    // }

    private request(config: {
        op: string;
        path: string;
        rev?: string;
        noStat?: boolean;
        calcStat?: boolean;
        method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'MOVE' | 'DELETE';
        user?: string;
        password?: string;
        headers?: Record<string, string>;
        data?: string | ArrayBuffer;
    }): Promise<StorageFileData> {
        if (config.rev) {
            this._logger.info(config.op, config.path, config.rev);
        } else {
            this._logger.info(config.op, config.path);
        }

        const ts = this._logger.ts();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('load', () => {
                if ([200, 201, 204].indexOf(xhr.status) < 0) {
                    this._logger.info(
                        config.op + ' error',
                        config.path,
                        xhr.status,
                        this._logger.ts(ts)
                    );
                    switch (xhr.status) {
                        case 404:
                            reject(new StorageFileNotFoundError());
                            break;
                        case 412:
                            reject(new StorageRevConflictError('', ''));
                            break;
                        default:
                            reject(new HttpRequestError(xhr.status));
                            break;
                    }
                    return;
                }

                const responseData: unknown = xhr.response;
                if (!(responseData instanceof ArrayBuffer)) {
                    reject(new Error('Not an array buffer'));
                    return;
                }

                (async () => {
                    let rev = xhr.getResponseHeader('Last-Modified');
                    if (!rev) {
                        if (!config.noStat) {
                            this._logger.info(
                                config.op + ' error',
                                config.path,
                                'no headers',
                                this._logger.ts(ts)
                            );
                            reject(new Error(Locale.webdavNoLastModified));
                            return;
                        }
                        if (config.calcStat) {
                            rev = await this.calcRevByContent(xhr);
                        } else {
                            reject(new Error(Locale.webdavNoLastModified));
                            return;
                        }
                    }

                    const completedOpName =
                        config.op + (config.op.charAt(config.op.length - 1) === 'e' ? 'd' : 'ed');
                    this._logger.info(completedOpName, config.path, rev, this._logger.ts(ts));

                    resolve({ data: responseData, rev });
                })().catch(noop);
            });
            xhr.addEventListener('error', () => {
                this._logger.info(config.op + ' error', config.path, this._logger.ts(ts));
                reject(new Error('Network error'));
            });
            xhr.addEventListener('abort', () => {
                this._logger.info(
                    config.op + ' error',
                    config.path,
                    'aborted',
                    this._logger.ts(ts)
                );
                return new Error('Aborted');
            });
            xhr.open(config.method, config.path);
            xhr.responseType = 'arraybuffer';
            if (config.user) {
                xhr.setRequestHeader(
                    'Authorization',
                    'Basic ' + btoa(`${config.user}:${config.password ?? ''}`)
                );
            }
            if (config.headers) {
                for (const [header, value] of Object.entries(config.headers)) {
                    xhr.setRequestHeader(header, value);
                }
            }
            if (['GET', 'HEAD'].indexOf(config.method) >= 0) {
                xhr.setRequestHeader('Cache-Control', 'no-cache');
            }
            if (config.data) {
                const blob = new Blob([config.data], { type: 'application/octet-stream' });
                xhr.send(blob);
            } else {
                xhr.send();
            }
        });
    }

    private calcRevByContent(xhr: XMLHttpRequest): Promise<string> {
        if (
            xhr.status !== 200 ||
            xhr.responseType !== 'arraybuffer' ||
            !(xhr.response instanceof ArrayBuffer) ||
            !xhr.response.byteLength
        ) {
            this._logger.info('Cannot calculate rev by content');
            return Promise.reject(new Error('Cannot calculate rev by content'));
        }

        const byteLength = xhr.response.byteLength;

        return kdbxweb.CryptoEngine.sha256(xhr.response).then((hash) => {
            const rev = kdbxweb.ByteUtils.bytesToHex(hash).substr(0, 10);
            this._logger.info('Calculated rev by content', `${byteLength} bytes`, rev);
            return rev;
        });
    }

    list: undefined;
    mkdir: undefined;
    remove: undefined;
    watch: undefined;
    unwatch: undefined;
}

export { StorageWebDav };
