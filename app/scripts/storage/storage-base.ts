import { Events } from 'util/events';
import { Links } from 'const/links';
import { Logger } from 'util/logger';
import { StorageOAuthListener } from 'storage/storage-oauth-listener';
import { UrlFormat } from 'util/formatting/url-format';
import { Launcher } from 'comp/launcher';
import { Features } from 'util/features';
import { createOAuthSession } from 'storage/pkce';
import { RuntimeData } from 'models/runtime-data';
import { HttpRequestConfig, HttpResponse } from 'comp/launcher/desktop-ipc';
import { AppSettings } from 'models/app-settings';
import { noop } from 'util/fn';
import {
    BrowserAuthStartedError,
    HttpRequestError,
    OAuthRejectedError,
    StorageFileData,
    StorageFileOptions,
    StorageFileStat,
    StorageFileWatcherCallback,
    StorageListItem,
    StorageOAuthConfig,
    StorageOpenConfig,
    StorageSaveResult,
    StorageSettingsConfig
} from './types';

const MaxRequestRetries = 3;

interface StorageProviderOAuthToken {
    dt?: number;
    accessToken: string;
    refreshToken?: string;
    authenticationToken?: string;
    expiresIn?: number;
    expired?: boolean;
    scope?: string;
    userId?: string;
}

function isStorageProviderOAuthToken(obj: unknown): obj is StorageProviderOAuthToken {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return false;
    }
    const record = obj as Record<string, unknown>;
    if (typeof record.accessToken !== 'string') {
        return false;
    }
    if (typeof (record.refreshToken ?? '') !== 'string') {
        return false;
    }
    if (typeof (record.expires ?? 0) !== 'number') {
        return false;
    }
    return true;
}

abstract class StorageBase {
    readonly name: string;
    readonly icon?: string;
    readonly uipos?: number;
    readonly system: boolean;
    readonly backup: boolean;

    protected readonly _logger: Logger;
    private _oauthToken?: StorageProviderOAuthToken;

    protected constructor(props: {
        name: string;
        icon?: string;
        system?: boolean;
        uipos?: number;
        backup?: boolean;
    }) {
        if (!props.name) {
            throw new Error('Failed to init provider: no name');
        }
        this.name = props.name;
        this.icon = props.icon;
        this.system = !!props.system;
        this.backup = !!props.backup;
        this.uipos = props.uipos;

        this._logger = new Logger('storage-' + this.name);
    }

    abstract load(id: string, opts?: StorageFileOptions): Promise<StorageFileData>;

    abstract stat(id: string, opts?: StorageFileOptions): Promise<StorageFileStat>;

    abstract save(
        id: string,
        data: ArrayBuffer,
        opts?: StorageFileOptions,
        rev?: string
    ): Promise<StorageSaveResult>;

    abstract remove?(id: string, opts?: StorageFileOptions): Promise<void>;

    abstract list?(dir?: string): Promise<StorageListItem[]>;

    abstract mkdir?(path: string): Promise<void>;

    abstract watch?(path: string, callback: StorageFileWatcherCallback): void;

    abstract unwatch?(path: string, callback: StorageFileWatcherCallback): void;

    abstract getPathForName?(fileName: string): string;

    protected getOAuthConfig(): StorageOAuthConfig {
        throw new Error('OAuth is not supported');
    }

    abstract get enabled(): boolean;

    get loggedIn(): boolean {
        return !!this.getStoredOAuthToken();
    }

    logout(): Promise<void> {
        return Promise.resolve();
    }

    private getStoredOAuthToken(): StorageProviderOAuthToken | undefined {
        const token = RuntimeData.get(`${this.name}OAuthToken`);
        return isStorageProviderOAuthToken(token) ? token : undefined;
    }

    private setStoredToken(token: StorageProviderOAuthToken): void {
        if (!AppSettings.shortLivedStorageToken) {
            RuntimeData.set(`${this.name}OAuthToken`, token);
        }
    }

    private deleteStoredToken(): void {
        RuntimeData.delete(`${this.name}OAuthToken`);
    }

    protected async xhr(config: HttpRequestConfig): Promise<HttpResponse> {
        this._logger.info('HTTP request', config.method || 'GET', config.url);
        if (config.data) {
            if (!config.dataType) {
                config.dataType = 'application/octet-stream';
            }
            config.headers = {
                ...config.headers,
                'Content-Type': config.dataType
            };
        }
        if (this._oauthToken && !config.skipAuth) {
            config.headers = {
                ...config.headers,
                'Authorization': 'Bearer ' + this._oauthToken.accessToken
            };
        }

        const response = await this.httpRequest(config);

        this._logger.info('HTTP response', response.status);
        const statuses = config.statuses || [200];
        if (statuses.includes(response.status)) {
            return response;
        }

        if (response.status === 401 && this._oauthToken) {
            try {
                this._logger.info('Trying to get a new token');
                await this.oauthGetNewToken();
            } catch (err) {
                this._logger.info('Failed to get a new token');
                throw new Error('unauthorized');
            }

            config.tryNum = (config.tryNum || 0) + 1;
            if (config.tryNum >= MaxRequestRetries) {
                this._logger.info('Too many authorize attempts, returning a failure', config.url);
                throw new Error('unauthorized');
            }
            this._logger.info(`Repeating request, retry ${config.tryNum}`, config.url);
            return this.xhr(config);
        } else {
            throw new HttpRequestError(response.status);
        }
    }

    private httpRequest(config: HttpRequestConfig): Promise<HttpResponse> {
        if (Launcher) {
            return this.httpRequestLauncher(config);
        } else {
            return this.httpRequestWeb(config);
        }
    }

    private httpRequestWeb(config: HttpRequestConfig): Promise<HttpResponse> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            if (config.responseType) {
                xhr.responseType = config.responseType;
            }
            xhr.addEventListener('load', () => {
                const headers: Record<string, string> = {};
                for (const headerLine of xhr
                    .getAllResponseHeaders()
                    .trim()
                    .split(/[\r\n]+/)) {
                    const header = headerLine.split(': ')[0];
                    const value = xhr.getResponseHeader(header);
                    if (header && value) {
                        headers[header] = value;
                    }
                }
                resolve({
                    status: xhr.status,
                    data: xhr.response,
                    headers
                });
            });
            xhr.addEventListener('error', () => {
                reject(new Error('network error'));
            });
            xhr.addEventListener('timeout', () => {
                reject(new Error('timeout'));
            });
            xhr.open(config.method || 'GET', config.url);
            if (config.headers) {
                for (const [key, value] of Object.entries(config.headers)) {
                    xhr.setRequestHeader(key, value);
                }
            }

            let blob: Blob | undefined;
            if (config.multipartData) {
                blob = new Blob(config.multipartData, { type: config.dataType });
            } else if (config.data) {
                blob = new Blob([config.data], { type: config.dataType });
            }
            xhr.send(blob);
        });
    }

    private httpRequestLauncher(config: HttpRequestConfig): Promise<HttpResponse> {
        if (!Launcher) {
            throw new Error('no launcher');
        }
        return Launcher.ipcRenderer.invoke('http-request', config);
    }

    private openPopup(url: string, title: string, width: number, height: number): Window | null {
        const dualScreenLeft = window.screenLeft || 0;
        const dualScreenTop = window.screenTop || 0;

        const winWidth = window.innerWidth
            ? window.innerWidth
            : document.documentElement.clientWidth
            ? document.documentElement.clientWidth
            : screen.width;
        const winHeight = window.innerHeight
            ? window.innerHeight
            : document.documentElement.clientHeight
            ? document.documentElement.clientHeight
            : screen.height;

        const left = winWidth / 2 - width / 2 + dualScreenLeft;
        const top = winHeight / 2 - height / 2 + dualScreenTop;

        const settings: Record<string, string | number> = {
            width,
            height,
            left,
            top,
            dialog: 'yes',
            dependent: 'yes',
            scrollbars: 'yes',
            location: 'yes'
        };

        const settingsStr = Object.entries(settings)
            .map(([key, value]) => `${key}=${value}`)
            .join(',');

        return window.open(url, title, settingsStr);
    }

    private getOauthRedirectUrl(): string {
        let redirectUrl = window.location.href;
        if (redirectUrl.lastIndexOf('file:', 0) === 0) {
            redirectUrl = Links.WebApp;
        }
        return new URL(`oauth-result/${this.name}.html`, redirectUrl).href;
    }

    protected async oauthAuthorize(): Promise<void> {
        if (this.tokenIsValid(this._oauthToken)) {
            return Promise.resolve();
        }
        const opts = this.getOAuthConfig();
        const oldToken = this.getStoredOAuthToken();
        if (this.tokenIsValid(oldToken)) {
            this._oauthToken = oldToken;
            return;
        }

        if (oldToken && oldToken.refreshToken) {
            await this.oauthExchangeRefreshToken();
            return;
        }

        const session = createOAuthSession();
        let sessionRedirectUri: string;

        if (!session) {
            throw new Error('Failed to create OAuth session');
        }

        let listener;
        if (Features.isDesktop) {
            listener = StorageOAuthListener.listen(this.name);
            sessionRedirectUri = listener.redirectUri;
        } else {
            sessionRedirectUri = this.getOauthRedirectUrl();
        }

        const pkceParams = opts.pkce
            ? {
                  'code_challenge': session.codeChallenge,
                  'code_challenge_method': 'S256'
              }
            : undefined;

        const url = UrlFormat.makeUrl(opts.url, {
            'client_id': opts.clientId,
            'scope': opts.scope,
            'state': session.state,
            'redirect_uri': sessionRedirectUri,
            'response_type': 'code',
            ...pkceParams,
            ...opts.urlParams
        });

        if (listener) {
            const oauthListener = listener;
            return new Promise((resolve, reject) => {
                oauthListener.on('ready', () => {
                    Launcher?.openLink(url);
                    reject(new BrowserAuthStartedError());
                });
                oauthListener.on('error', reject);
                oauthListener.on('result', (state, code) => {
                    this.oauthCodeReceived({
                        state,
                        code,
                        sessionState: session.state,
                        codeVerifier: session.codeVerifier,
                        redirectUri: sessionRedirectUri
                    }).catch(noop);
                });
            });
        }

        const popupWindow = this.openPopup(url, 'OAuth', opts.width, opts.height);
        if (!popupWindow) {
            throw new Error('OAuth: cannot open popup');
        }

        this._logger.info('OAuth: popup opened');

        return new Promise((resolve, reject) => {
            const processWindowMessage = (locationSearch: string) => {
                const data = Object.fromEntries(new URLSearchParams(locationSearch).entries());
                if (data.error) {
                    this._logger.error('OAuth error', data.error, data.error_description);
                    reject(new Error('OAuth: ' + data.error));
                } else if (data.code) {
                    Events.off('popup-closed', popupClosed);
                    window.removeEventListener('message', windowMessage);
                    resolve(
                        this.oauthCodeReceived({
                            code: data.code,
                            state: data.state ?? null,
                            codeVerifier: session.codeVerifier,
                            sessionState: session.state,
                            redirectUri: sessionRedirectUri
                        })
                    );
                } else {
                    this._logger.info('Skipped OAuth message', data);
                }
            };

            const popupClosed = (win: Window, locationSearch?: string) => {
                Events.off('popup-closed', popupClosed);
                window.removeEventListener('message', windowMessage);
                if (locationSearch) {
                    // see #1711: mobile Safari in PWA mode can't close the pop-up, but it returns the url
                    processWindowMessage(locationSearch);
                } else {
                    this._logger.error('OAuth error', 'popup closed');
                    reject(new OAuthRejectedError('popup closed'));
                }
            };

            const windowMessage = (e: MessageEvent) => {
                if (e.origin !== location.origin) {
                    return;
                }
                if (!e.data) {
                    this._logger.info('Skipped empty OAuth message', e.data);
                    return;
                }
                const data = e.data as Record<string, unknown>;
                if (!data.storage || typeof data.search !== 'string') {
                    this._logger.info('Skipped an empty OAuth message', e.data);
                    return;
                }
                if (data.storage !== this.name) {
                    this._logger.info('Skipped OAuth message for another storage', data.storage);
                    return;
                }
                processWindowMessage(data.search);
            };

            Events.on('popup-closed', popupClosed);
            window.addEventListener('message', windowMessage);
        });
    }

    private oauthProcessReturn(message: unknown): void {
        this._oauthToken = this.oauthMsgToToken(message);
        this.setStoredToken(this._oauthToken);
        this._logger.info('OAuth token received');
    }

    private oauthMsgToToken(data: unknown): StorageProviderOAuthToken {
        if (!data || typeof data !== 'object') {
            throw new Error('Empty OAuth token');
        }

        const record = data as Record<string, unknown>;

        if (typeof record.token_type !== 'string' || record.token_type.toLowerCase() !== 'bearer') {
            if (typeof record.error === 'string') {
                this._logger.error(
                    'OAuth token exchange error',
                    record.error,
                    record.error_description
                );
                throw new Error(record.error);
            } else {
                throw new Error('OAuth token without token type');
            }
        }

        const accessToken = record.access_token;
        const refreshToken =
            typeof record.refresh_token === 'string' ? record.refresh_token : undefined;
        const authenticationToken =
            typeof record.authentication_token === 'string'
                ? record.authentication_token
                : undefined;
        const expiresIn = typeof record.expires_in === 'number' ? record.expires_in : undefined;
        const scope = typeof record.scope === 'string' ? record.scope : undefined;
        const userId = typeof record.user_id === 'string' ? record.user_id : undefined;

        if (!accessToken || typeof accessToken !== 'string') {
            throw new Error('OAuth token without access token');
        }
        if (record.refresh_token && typeof record.refresh_token !== 'string') {
            throw new Error('OAuth token with bad refresh token');
        }

        return {
            dt: Date.now() - 60 * 1000,
            accessToken,
            refreshToken,
            authenticationToken,
            expiresIn,
            scope,
            userId
        };
    }

    private async oauthGetNewToken(): Promise<void> {
        if (this._oauthToken) {
            this._oauthToken.expired = true;
            this.setStoredToken(this._oauthToken);
        }
        if (this._oauthToken?.refreshToken) {
            await this.oauthExchangeRefreshToken();
        } else {
            await this.oauthAuthorize();
        }
    }

    protected async oauthRevokeToken(url?: string, usePost?: boolean): Promise<void> {
        const token = this.getStoredOAuthToken();
        if (token) {
            if (url) {
                await this.xhr({
                    url: url.replace('{token}', token.accessToken),
                    statuses: [200, 401],
                    method: usePost ? 'POST' : 'GET'
                });
            }
            this.deleteStoredToken();
            this._oauthToken = undefined;
        }
    }

    private tokenIsValid(token: StorageProviderOAuthToken | undefined) {
        if (!token || token.expired) {
            return false;
        }
        if (token.dt && token.expiresIn && token.dt + token.expiresIn * 1000 < Date.now()) {
            return false;
        }
        return true;
    }

    private async oauthCodeReceived(result: {
        state: string | null;
        code: string | null;
        sessionState: string;
        redirectUri: string;
        codeVerifier: string;
    }) {
        if (!result.state) {
            this._logger.info('OAuth result has no state');
            throw new Error('OAuth result has no state');
        }
        if (result.state !== result.sessionState) {
            this._logger.info('OAuth result has bad state');
            throw new Error('OAuth result has bad state');
        }

        if (!result.code) {
            this._logger.info('OAuth result has no code');
            throw new Error('OAuth result has no code');
        }

        this._logger.info('OAuth code received');

        if (Launcher) {
            Launcher.ipcRenderer.invoke('show-main-window').catch(noop);
        }
        const config = this.getOAuthConfig();
        const pkceParams = config.pkce ? { 'code_verifier': result.codeVerifier } : undefined;

        let response: HttpResponse;
        try {
            response = await this.xhr({
                url: config.tokenUrl,
                method: 'POST',
                responseType: 'json',
                skipAuth: true,
                data: UrlFormat.buildFormData({
                    'client_id': config.clientId,
                    ...(config.clientSecret ? { 'client_secret': config.clientSecret } : null),
                    'grant_type': 'authorization_code',
                    'code': result.code,
                    'redirect_uri': result.redirectUri,
                    ...pkceParams
                }),
                dataType: 'application/x-www-form-urlencoded'
            });
        } catch (e) {
            this._logger.error('Error exchanging OAuth code', e);
            throw e;
        }

        this._logger.info('OAuth code exchanged', response);
        this.oauthProcessReturn(response);
    }

    private async oauthExchangeRefreshToken(): Promise<void> {
        this._logger.info('Exchanging refresh token');
        const refreshToken = this.getStoredOAuthToken()?.refreshToken;
        if (!refreshToken) {
            throw new Error('No refresh token');
        }
        const config = this.getOAuthConfig();
        let res: HttpResponse;
        try {
            res = await this.xhr({
                url: config.tokenUrl,
                method: 'POST',
                responseType: 'json',
                skipAuth: true,
                data: UrlFormat.buildFormData({
                    'client_id': config.clientId,
                    ...(config.clientSecret ? { 'client_secret': config.clientSecret } : null),
                    'grant_type': 'refresh_token',
                    'refresh_token': refreshToken
                }),
                dataType: 'application/x-www-form-urlencoded'
            });
        } catch (e) {
            if (e instanceof HttpRequestError && e.status === 400) {
                this.deleteStoredToken();
                this._oauthToken = undefined;
                this._logger.error('Error exchanging refresh token, trying to authorize again');
                return this.oauthAuthorize();
            } else {
                this._logger.error('Error exchanging refresh token', e);
                throw new Error('Error exchanging refresh token');
            }
        }

        this._logger.info('Refresh token exchanged');
        if (typeof res.data === 'object') {
            const rec = res.data as Record<string, unknown>;
            // eslint-disable-next-line camelcase
            rec.refresh_token = refreshToken;
        }
        this.oauthProcessReturn(res.data);
    }

    get needShowOpenConfig(): boolean {
        return false;
    }

    getOpenConfig(): StorageOpenConfig {
        throw new Error('getOpenConfig is not implemented');
    }

    getSettingsConfig(): StorageSettingsConfig {
        throw new Error('getSettingsConfig is not implemented');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    applyConfig(config: Record<string, string | null>): Promise<void> {
        throw new Error('applyConfig is not implemented');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    applySetting(key: string, value: string | null): void {
        throw new Error('applySetting is not implemented');
    }
}

export { StorageBase };
