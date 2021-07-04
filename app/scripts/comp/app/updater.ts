import * as kdbxweb from 'kdbxweb';
import { RuntimeInfo } from 'const/runtime-info';
import { Launcher } from 'comp/launcher';
import { Links } from 'const/links';
import { AppSettings } from 'models/app-settings';
import { SemVer } from 'util/data/semver';
import { Logger } from 'util/logger';
import { SignatureVerifier } from 'util/data/signature-verifier';
import { Model } from 'util/model';
import { Timeouts } from 'const/timeouts';
import { RuntimeData } from 'models/runtime-data';
import { noop } from 'util/fn';
import { StringFormat } from 'util/formatting/string-format';
import { ClientRequestArgs } from 'http';
import * as fs from 'fs';
import path from 'path';
import https from 'https';

const logger = new Logger('updater');

class Updater extends Model {
    readonly enabled = Launcher?.updaterEnabled() ?? false;

    status: 'unknown' | 'ready' | 'checking' | 'error' | 'ok' = 'unknown';

    updateStatus:
        | 'unknown'
        | 'found'
        | 'ready'
        | 'downloading'
        | 'extracting'
        | 'updating'
        | 'error' = 'unknown';

    updateError?: string;

    private _nextCheckTimeout?: number;
    private _updateCheckDate = new Date(0);

    init(): void {
        this.scheduleNextCheck();
        if (!Launcher && navigator.serviceWorker && !RuntimeInfo.beta && !RuntimeInfo.devMode) {
            navigator.serviceWorker
                .register('service-worker.js')
                .then((reg) => {
                    logger.info('Service worker registered');
                    reg.addEventListener('updatefound', () => {
                        if (reg.active) {
                            logger.info('Service worker found an update');
                            this.updateStatus = 'ready';
                        }
                    });
                })
                .catch((e) => {
                    logger.error('Failed to register a service worker', e);
                });
        }
    }

    get updateInProgress(): boolean {
        return (
            this.status === 'checking' ||
            ['downloading', 'extracting', 'updating'].includes(this.updateStatus)
        );
    }

    scheduleNextCheck(): void {
        if (this._nextCheckTimeout) {
            clearTimeout(this._nextCheckTimeout);
            this._nextCheckTimeout = undefined;
        }
        if (!this.enabled || !AppSettings.autoUpdate) {
            return;
        }
        let timeDiff = Timeouts.MinUpdateTimeout;
        const lastCheckDate = RuntimeData.lastUpdateCheckDate;
        if (lastCheckDate) {
            timeDiff = Math.min(
                Math.max(
                    Timeouts.UpdateInterval + (lastCheckDate.getTime() - Date.now()),
                    Timeouts.MinUpdateTimeout
                ),
                Timeouts.UpdateInterval
            );
        }
        this._nextCheckTimeout = window.setTimeout(() => {
            this.check(false).catch(noop);
        }, timeDiff);
        logger.info(`Next update check will happen in ${Math.round(timeDiff / 1000)}s`);
    }

    async check(startedByUser: boolean) {
        if (!this.enabled || this.updateInProgress) {
            return;
        }
        this.status = 'checking';
        if (!startedByUser) {
            // additional protection from broken program logic, to ensure that auto-checks are not performed more than once an hour
            const diffMs = Date.now() - this._updateCheckDate.getTime();
            if (isNaN(diffMs) || diffMs < 1000 * 60 * 60) {
                logger.error(
                    'Prevented update check; last check was performed at',
                    this._updateCheckDate
                );
                this.scheduleNextCheck();
                return;
            }
            this._updateCheckDate = new Date();
        }
        logger.info('Checking for update...');

        let data: Buffer | undefined;
        try {
            const httpRes = await this.httpGet({
                url: Links.UpdateJson
            });
            data = httpRes.data;
        } catch (e) {
            logger.error('Update check error', e);
            RuntimeData.batchSet(() => {
                RuntimeData.lastUpdateCheckDate = new Date();
                RuntimeData.lastUpdateCheckError = 'Error checking last version';
            });
            this.status = 'error';
            this.scheduleNextCheck();
            return;
        }

        let updateJson: Record<string, unknown>;
        try {
            const parsed = JSON.parse(data?.toString() || '') as unknown;
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Empty data');
            }
            updateJson = parsed as Record<string, unknown>;
        } catch (e) {
            logger.error('Failed to parse JSON', data);
            return;
        }

        const updateVersion = updateJson.version;
        const updateDate = new Date(String(updateJson.date));

        const dt = new Date();
        logger.info('Update check', updateVersion || 'no version', updateDate);

        if (typeof updateVersion !== 'string' || !updateDate.getTime()) {
            RuntimeData.batchSet(() => {
                RuntimeData.lastUpdateCheckDate = dt;
                RuntimeData.lastUpdateCheckError = 'Failed to parse update information';
            });
            this.status = 'error';
            this.scheduleNextCheck();
            return;
        }

        const prevLastVersion = RuntimeData.lastUpdateVersion;
        RuntimeData.batchSet(() => {
            RuntimeData.lastUpdateCheckDate = dt;
            RuntimeData.lastSuccessUpdateCheckDate = dt;
            RuntimeData.lastUpdateVersionReleaseDate = updateDate;
            RuntimeData.lastUpdateVersion = updateVersion;
            RuntimeData.lastUpdateCheckError = undefined;
        });
        this.status = 'ok';
        this.scheduleNextCheck();

        if (prevLastVersion === RuntimeData.lastUpdateVersion && this.updateStatus === 'ready') {
            logger.info('Waiting for the user to apply downloaded update');
            return;
        }
        if (!startedByUser && AppSettings.autoUpdate === 'install') {
            await this.update();
        } else if (SemVer.compareVersions(updateVersion, RuntimeInfo.version) > 0) {
            this.updateStatus = 'found';
        }
    }

    async updateAndRestart() {
        await this.update();
        await this.installAndRestart();
    }

    private async update() {
        if (!this.enabled) {
            logger.info('Updater is disabled');
            return;
        }
        const ver = RuntimeData.lastUpdateVersion;
        if (!ver) {
            logger.info('No last update version');
            return;
        }
        if (SemVer.compareVersions(RuntimeInfo.version, ver) >= 0) {
            logger.info('You are using the latest version');
            return;
        }

        this.batchSet(() => {
            this.updateStatus = 'downloading';
            this.updateError = undefined;
        });

        logger.info('Downloading update', ver);
        const updateAssetName = this.getUpdateAssetName(ver);
        if (!updateAssetName) {
            logger.error('Empty updater asset name for', process.platform, process.arch);
            return;
        }

        const updateUrlBasePath = Links.UpdateBasePath.replace('{ver}', ver);
        const updateAssetUrl = updateUrlBasePath + updateAssetName;

        let assetFilePath: string;
        try {
            const httpRes = await this.httpGet({
                url: updateAssetUrl,
                file: updateAssetName,
                cleanupOldFiles: true,
                cache: true
            });
            if (!httpRes.fileName) {
                throw new Error('No fileName');
            }
            assetFilePath = httpRes.fileName;
        } catch (e) {
            logger.error('Error downloading update', e);
            this.batchSet(() => {
                this.updateStatus = 'error';
                this.updateError = 'Error downloading update';
            });
            return;
        }

        logger.info('Downloading update signatures');

        let assetFileSignaturePath: string;
        try {
            const httpRes = await this.httpGet({
                url: updateUrlBasePath + 'Verify.sign.sha256',
                file: updateAssetName + '.sign',
                cleanupOldFiles: true,
                cache: true
            });
            if (!httpRes.fileName) {
                throw new Error('No fileName');
            }
            assetFileSignaturePath = httpRes.fileName;
        } catch (e) {
            logger.error('Error downloading update signatures', e);
            this.batchSet(() => {
                this.updateStatus = 'error';
                this.updateError = 'Error downloading update signatures';
            });
            return;
        }

        let valid: boolean;
        try {
            valid = await this.verifySignature(assetFilePath, updateAssetName);
        } catch (err) {
            this.batchSet(() => {
                this.updateStatus = 'error';
                this.updateError = 'Error verifying update signature';
            });
            return;
        }

        if (!valid) {
            this.batchSet(() => {
                this.updateStatus = 'error';
                this.updateError = 'Invalid update signature';
            });
            fs.unlink(assetFilePath, noop);
            fs.unlink(assetFileSignaturePath, noop);
            return;
        }

        logger.info('Update is ready', assetFilePath);
        this.batchSet(() => {
            this.updateStatus = 'ready';
            this.updateError = undefined;
        });
    }

    private async verifySignature(assetFilePath: string, assetName: string): Promise<boolean> {
        logger.info('Verifying update signature', assetName);
        const signaturesTxt = await fs.promises.readFile(assetFilePath + '.sign', 'utf8');
        const assetSignatureLine = signaturesTxt
            .split('\n')
            .find((line) => line.endsWith(assetName));
        if (!assetSignatureLine) {
            logger.error('Signature not found for asset', assetName);
            throw new Error('Asset signature not found');
        }
        const signature = kdbxweb.ByteUtils.hexToBytes(assetSignatureLine.split(' ')[0]);
        const fileBytes = fs.readFileSync(assetFilePath);
        try {
            const valid = await SignatureVerifier.verify(fileBytes, signature);
            logger.info(`Update asset signature is ${valid ? 'valid' : 'invalid'}`);
            return valid;
        } catch (e) {
            logger.error('Error verifying signature', e);
            throw e;
        }
    }

    private getUpdateAssetName(ver: string): string | undefined {
        const platform = process.platform;
        const arch = process.arch;
        switch (platform) {
            case 'win32':
                switch (arch) {
                    case 'x64':
                        return `KeeWeb-${ver}.win.x64.exe`;
                    case 'ia32':
                        return `KeeWeb-${ver}.win.ia32.exe`;
                    case 'arm64':
                        return `KeeWeb-${ver}.win.arm64.exe`;
                }
                break;
            case 'darwin':
                switch (arch) {
                    case 'x64':
                        return `KeeWeb-${ver}.mac.x64.dmg`;
                    case 'arm64':
                        return `KeeWeb-${ver}.mac.arm64.dmg`;
                }
                break;
        }
        return undefined;
    }

    async installAndRestart(): Promise<void> {
        if (!Launcher || !RuntimeData.lastUpdateVersion) {
            return;
        }
        const updateAssetName = this.getUpdateAssetName(RuntimeData.lastUpdateVersion);
        const updateFilePath = await this.cacheFilePath(updateAssetName);
        Launcher.requestRestartAndUpdate(updateFilePath);
    }

    async cacheFilePath(fileName?: string): Promise<string> {
        const tempPath = await Launcher?.ipcRenderer.invoke('get-temp-path');
        if (!tempPath) {
            throw new Error('Failed to get temp path');
        }
        return fileName ? path.join(tempPath, fileName) : tempPath;
    }

    async httpGet(config: {
        url: string;
        file?: string;
        cache?: boolean;
        cleanupOldFiles?: boolean;
        noRedirect?: boolean;
    }): Promise<{ fileName?: string; data?: Buffer }> {
        let tmpFile: string;
        if (config.file) {
            const baseTempPath = await this.cacheFilePath();
            if (config.cleanupOldFiles) {
                const allFiles = await fs.promises.readdir(baseTempPath);
                for (const file of allFiles) {
                    if (
                        file !== config.file &&
                        StringFormat.replaceVersion(file, '0') ===
                            StringFormat.replaceVersion(config.file, '0')
                    ) {
                        await fs.promises.unlink(path.join(baseTempPath, file));
                    }
                }
            }
            tmpFile = path.join(baseTempPath, config.file);
            let tmpFileExists = true;
            try {
                await fs.promises.access(tmpFile);
            } catch {
                tmpFileExists = false;
            }
            if (tmpFileExists) {
                try {
                    if (config.cache && (await fs.promises.stat(tmpFile)).size > 0) {
                        logger.info('File already downloaded', config.url);
                        return Promise.resolve({ fileName: tmpFile });
                    } else {
                        await fs.promises.unlink(tmpFile);
                    }
                } catch (e) {
                    fs.promises.unlink(tmpFile).catch(noop);
                }
            }
        }

        logger.info('GET ' + config.url);

        const proxy = await Launcher?.ipcRenderer.invoke('resolve-proxy', config.url);

        const url = new URL(config.url);
        const opts: ClientRequestArgs = {
            host: url.host,
            port: url.port,
            path: url.pathname + url.search
        };
        opts.headers = { 'User-Agent': navigator.userAgent };

        logger.info(
            'Request to ' +
                config.url +
                ' ' +
                (proxy ? `using proxy ${proxy.host}:${proxy.port}` : 'without proxy')
        );
        if (proxy) {
            opts.headers.Host = url.host;
            opts.host = proxy.host;
            opts.port = proxy.port;
            opts.path = config.url;
        }

        return new Promise((resolve, reject) => {
            https
                .get(opts, (res) => {
                    logger.info(`Response from ${config.url}: `, res.statusCode);
                    if (res.statusCode === 200) {
                        if (config.file) {
                            const file = fs.createWriteStream(tmpFile);
                            res.pipe(file);
                            file.on('finish', () => {
                                file.on('close', () => {
                                    resolve({ fileName: tmpFile });
                                });
                                file.close();
                            });
                            file.on('error', (err) => {
                                reject(err);
                            });
                        } else {
                            const chunks: Buffer[] = [];
                            res.on('data', (chunk) => {
                                chunks.push(chunk);
                            });
                            res.on('end', () => {
                                resolve({ data: Buffer.concat(chunks) });
                            });
                        }
                    } else if (
                        res.headers.location &&
                        (res.statusCode === 301 || res.statusCode === 302)
                    ) {
                        if (config.noRedirect) {
                            return reject(new Error('Too many redirects'));
                        }
                        config.url = res.headers.location;
                        config.noRedirect = true;
                        resolve(this.httpGet(config));
                    } else {
                        reject(new Error(`HTTP status ${res.statusCode ?? 0}`));
                    }
                })
                .on('error', (e) => {
                    logger.error('Cannot GET ' + config.url, e);
                    if (tmpFile) {
                        fs.unlink(tmpFile, noop);
                    }
                    reject(e);
                });
        });
    }
}

const instance = new Updater();

export { instance as Updater };
