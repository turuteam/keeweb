import * as kdbxweb from 'kdbxweb';
import { Model } from 'util/model';
import { RuntimeInfo } from 'const/runtime-info';
import { Launcher } from 'comp/launcher';
import { SettingsManager } from 'comp/settings/settings-manager';
import { AppSettings } from 'models/app-settings';
import { PluginApi } from 'plugins/plugin-api';
import { ThemeVars } from 'plugins/theme-vars';
import { IoCache } from 'storage/io-cache';
import { SemVer } from 'util/data/semver';
import { SignatureVerifier } from 'util/data/signature-verifier';
import { Logger } from 'util/logger';
import {
    PluginManifest,
    PluginManifestLocale,
    PluginManifestResources,
    PluginManifestTheme,
    PluginSetting
} from 'plugins/types';
import { Locale } from 'util/locale';
import { RuntimeData } from 'models/runtime-data';
import { errorToString } from 'util/fn';

const commonLogger = new Logger('plugin');
const io = new IoCache('PluginFiles', new Logger('storage-plugin-files'));

export type PluginStatus =
    | 'active'
    | 'inactive'
    | 'installing'
    | 'activating'
    | 'uninstalling'
    | 'updating'
    | 'invalid'
    | 'error';

class Plugin extends Model {
    id: string;
    name: string;
    logger: Logger;
    manifest: PluginManifest;
    url: string;
    status?: PluginStatus;
    autoUpdate = false;
    installTime?: number;
    installError?: string;
    updateCheckDate?: Date;
    updateError?: string;
    skipSignatureValidation = false;
    resources: Record<string, ArrayBuffer>;
    module?: { exports: Record<string, unknown> };

    constructor(url: string, manifest: PluginManifest, autoUpdate = false) {
        super();

        const name = manifest.name;
        if (!manifest.name) {
            throw new Error('Cannot create a plugin without name');
        }

        this.id = name;
        this.manifest = manifest;
        this.name = manifest.name;
        this.url = url;
        this.autoUpdate = autoUpdate;
        this.logger = new Logger('plugin', name);
        this.resources = {};
    }

    install(activate: boolean, local: boolean): Promise<void> {
        const ts = this.logger.ts();
        this.status = 'installing';
        return Promise.resolve().then(() => {
            const error = this.validateManifest();
            if (error) {
                this.logger.error('Manifest validation error', error);
                this.status = 'invalid';
                throw new Error('Plugin validation error: ' + error);
            }
            this.status = 'inactive';
            if (!activate) {
                this.logger.info('Loaded inactive plugin');
                return;
            }
            return this.installWithManifest(local)
                .then(() => {
                    this.installTime = this.logger.ts() - ts;
                })
                .catch((err) => {
                    this.logger.error('Error installing plugin', err);
                    this.batchSet(() => {
                        this.status = 'error';
                        this.installError = errorToString(err);
                        this.installTime = this.logger.ts() - ts;
                        this.updateError = undefined;
                    });
                    throw err;
                });
        });
    }

    validateManifest(): string | undefined {
        const manifest = this.manifest;
        if (!manifest.name) {
            return 'No plugin name';
        }
        if (!manifest.description) {
            return 'No plugin description';
        }
        if (!/^\d+\.\d+\.\d+$/.test(manifest.version || '')) {
            return 'Invalid plugin version';
        }
        if (manifest.manifestVersion !== '0.1.0') {
            return 'Invalid manifest version ' + manifest.manifestVersion;
        }
        if (
            !manifest.author ||
            !manifest.author.email ||
            !manifest.author.name ||
            !manifest.author.url
        ) {
            return 'Invalid plugin author';
        }
        if (!manifest.url) {
            return 'No plugin url';
        }
        if (!manifest.publicKey) {
            return 'No plugin public key';
        }
        if (
            !this.skipSignatureValidation &&
            !SignatureVerifier.getPublicKeys().includes(manifest.publicKey)
        ) {
            return 'Public key mismatch';
        }
        if (!manifest.resources || !Object.keys(manifest.resources).length) {
            return 'No plugin resources';
        }
        if (
            manifest.resources.loc &&
            (!manifest.locale ||
                !manifest.locale.title ||
                !/^[a-z]{2}(-[A-Z]{2})?$/.test(manifest.locale.name))
        ) {
            return 'Bad plugin locale';
        }
        if (manifest.desktop && !Launcher) {
            return 'Desktop plugin';
        }
        if (manifest.versionMin) {
            if (!/^\d+\.\d+\.\d+$/.test(manifest.versionMin)) {
                return 'Invalid versionMin';
            }
            if (SemVer.compareVersions(manifest.versionMin, RuntimeInfo.version) > 0) {
                return `Required min app version is ${manifest.versionMin}, actual ${RuntimeInfo.version}`;
            }
        }
        if (manifest.versionMax) {
            if (!/^\d+\.\d+\.\d+$/.test(manifest.versionMax)) {
                return 'Invalid versionMin';
            }
            if (SemVer.compareVersions(manifest.versionMax, RuntimeInfo.version) < 0) {
                return `Required max app version is ${manifest.versionMax}, actual ${RuntimeInfo.version}`;
            }
        }
    }

    validateUpdatedManifest(newManifest: PluginManifest): string | undefined {
        const manifest = this.manifest;
        if (manifest.name !== newManifest.name) {
            return 'Plugin name mismatch';
        }
        if (manifest.publicKey !== newManifest.publicKey) {
            const wasOfficial = SignatureVerifier.getPublicKeys().includes(manifest.publicKey);
            const isOfficial = SignatureVerifier.getPublicKeys().includes(newManifest.publicKey);
            if (!wasOfficial || !isOfficial) {
                return 'Public key mismatch';
            }
        }
    }

    installWithManifest(local: boolean): Promise<void> {
        const manifest = this.manifest;
        this.logger.info(
            'Loading plugin with resources',
            Object.keys(manifest.resources).join(', '),
            local ? '(local)' : '(url)'
        );
        this.resources = {};
        const ts = this.logger.ts();
        const results = Object.keys(manifest.resources).map((res) =>
            this.loadResource(res, local, manifest)
        );
        return Promise.all(results)
            .catch(() => {
                throw new Error('Error loading plugin resources');
            })
            .then(() => this.installWithResources())
            .then(() => (local ? undefined : this.saveResources()))
            .then(() => {
                this.logger.info('Install complete', this.logger.ts(ts));
            });
    }

    getResourcePath(res: string): string {
        switch (res) {
            case 'css':
                return 'plugin.css';
            case 'js':
                return 'plugin.js';
            case 'loc':
                if (!this.manifest.locale) {
                    throw new Error('Empty locale in plugin manifest');
                }
                return this.manifest.locale.name + '.json';
            default:
                this.logger.error('Unknown resource type', res);
                throw new Error('Unknown resource type');
        }
    }

    getStorageResourcePath(res: string): string {
        return this.id + '_' + this.getResourcePath(res);
    }

    async loadResource(type: string, local: boolean, manifest: PluginManifest): Promise<void> {
        const ts = this.logger.ts();
        let data: ArrayBuffer;
        if (local) {
            const storageKey = this.getStorageResourcePath(type);
            data = await io.load(storageKey);
        } else {
            const url = this.url + this.getResourcePath(type) + '?v=' + manifest.version;
            data = await httpGet(url, true);
        }
        this.logger.info('Resource data loaded', type, this.logger.ts(ts));
        await this.verifyResource(data, type);

        this.resources[type] = data;
    }

    async verifyResource(data: ArrayBuffer, type: string): Promise<void> {
        const ts = this.logger.ts();
        const manifest = this.manifest;

        const signature = manifest.resources[type as keyof PluginManifestResources];
        if (!signature) {
            throw new Error(`No signature: ${type}`);
        }
        const valid = await SignatureVerifier.verify(data, signature, manifest.publicKey);
        if (valid) {
            this.logger.info('Resource signature validated', type, this.logger.ts(ts));
        } else {
            this.logger.error('Resource signature invalid', type);
            throw new Error(`Signature invalid: ${type}`);
        }
    }

    installWithResources(): Promise<void> {
        this.logger.info('Installing plugin resources');
        const manifest = this.manifest;
        const promises = [];
        if (this.resources.css) {
            if (!manifest.theme) {
                throw new Error('Theme plugin without theme definition');
            }
            promises.push(this.applyCss(manifest.name, this.resources.css, manifest.theme));
        }
        if (this.resources.js) {
            promises.push(this.applyJs(manifest.name, this.resources.js));
        }
        if (this.resources.loc) {
            if (!manifest.locale) {
                throw new Error('Locale plugin without locale definition');
            }
            promises.push(this.applyLoc(manifest.locale, this.resources.loc));
        }

        return Promise.all(promises)
            .then(() => {
                this.status = 'active';
            })
            .catch((e) => {
                this.logger.info('Install error', e);
                this.status = 'error';
                return this.disable().then(() => {
                    throw e;
                });
            });
    }

    saveResources(): Promise<void> {
        const resourceSavePromises = [];
        for (const key of Object.keys(this.resources)) {
            resourceSavePromises.push(this.saveResource(key, this.resources[key]));
        }
        return Promise.all(resourceSavePromises)
            .catch((e) => {
                this.logger.info('Error saving plugin resources', e);
                return this.uninstall().then(() => {
                    throw new Error('Error saving plugin resources');
                });
            })
            .then(() => undefined);
    }

    saveResource(key: string, value: ArrayBuffer): Promise<void> {
        const storageKey = this.getStorageResourcePath(key);
        return io.save(storageKey, value);
    }

    deleteResources(): Promise<void> {
        const resourceDeletePromises = [];
        for (const key of Object.keys(this.resources)) {
            resourceDeletePromises.push(this.deleteResource(key));
        }
        return Promise.all(resourceDeletePromises).then(() => undefined);
    }

    async deleteResource(key: string): Promise<void> {
        const storageKey = this.getStorageResourcePath(key);
        try {
            await io.remove(storageKey);
        } catch (e) {
            this.logger.error('Error deleting plugin resource', e);
        }
    }

    applyCss(name: string, data: ArrayBuffer, theme: PluginManifestTheme): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const blob = new Blob([data], { type: 'text/css' });
                const objectUrl = URL.createObjectURL(blob);
                const id = 'plugin-css-' + name;
                const el = this.createElementInHead('link', id, {
                    rel: 'stylesheet',
                    href: objectUrl
                });
                if (!el) {
                    throw new Error('Failed to create a link');
                }
                el.addEventListener('load', () => {
                    URL.revokeObjectURL(objectUrl);
                    if (theme) {
                        const locKey = this.getThemeLocaleKey(theme.name);
                        SettingsManager.allThemes[theme.name] = locKey;
                        SettingsManager.customThemeNames.set(locKey, theme.title);
                        for (const styleSheet of Array.from(document.styleSheets)) {
                            const node = styleSheet.ownerNode as HTMLElement;
                            if (node?.id === id) {
                                this.processThemeStyleSheet(styleSheet, theme);
                                break;
                            }
                        }
                    }
                    this.logger.info('Plugin style installed');
                    resolve();
                });
            } catch (e) {
                this.logger.error('Error installing plugin style', e);
                reject(e);
            }
        });
    }

    processThemeStyleSheet(styleSheet: CSSStyleSheet, theme: PluginManifestTheme): void {
        const themeSelector = '.th-' + theme.name;
        const badSelectors = [];
        for (const rule of Array.from(styleSheet.cssRules)) {
            if (!(rule instanceof CSSStyleRule)) {
                continue;
            }
            if (rule.selectorText && rule.selectorText.lastIndexOf(themeSelector, 0) !== 0) {
                badSelectors.push(rule.selectorText);
            }
            if (rule.selectorText === themeSelector) {
                this.addThemeVariables(rule);
            }
        }
        if (badSelectors.length) {
            this.logger.error(
                'Themes must not add rules outside theme namespace. Bad selectors:',
                badSelectors
            );
            throw new Error('Invalid theme');
        }
    }

    addThemeVariables(rule: CSSStyleRule): void {
        ThemeVars.apply(rule.style);
    }

    applyJs(name: string, data: ArrayBuffer): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                let text = kdbxweb.ByteUtils.bytesToString(data);
                this.module = { exports: {} };
                const jsVar = 'plugin-' + Date.now().toString() + Math.random().toString();

                const globalRec = global as unknown as Record<string, unknown>;
                globalRec[jsVar] = {
                    require: (mod: string) => PluginApi.require(mod),
                    module: this.module
                };
                text = `(function(require, module){${text}})(window["${jsVar}"].require,window["${jsVar}"].module);`;
                const ts = this.logger.ts();

                // Note that here we're calling eval to run the plugin code,
                // previously it was loaded as 'blob:' scheme (see the code below), however:
                // 1. we need to have eval enabled in our CSP anyway for WASM,
                //      see https://github.com/WebAssembly/content-security-policy/issues/7
                // 2. we would like to prevent Chrome extensions from injecting scripts to our page,
                //      which is possible to do if we have 'blob:', but they can't call eval
                // Previous implementation with 'blob:' can be found in git, if we ever need to restore it.

                // eslint-disable-next-line no-eval
                eval(text);
                setTimeout(() => {
                    delete globalRec[jsVar];
                    if (typeof this.module?.exports.uninstall === 'function') {
                        this.logger.info('Plugin script installed', this.logger.ts(ts));
                        this.loadPluginSettings();
                        resolve();
                    } else {
                        reject('Plugin script installation failed');
                    }
                }, 0);
            } catch (e) {
                this.logger.error('Error installing plugin script', e);
                reject(e);
            }
        });
    }

    createElementInHead(tagName: string, id: string, attrs: Record<string, string>): HTMLElement {
        let el = document.getElementById(id);
        if (el) {
            el.remove();
        }
        el = document.createElement(tagName);
        el.setAttribute('id', id);
        for (const [name, value] of Object.entries(attrs)) {
            el.setAttribute(name, value);
        }
        document.head.appendChild(el);
        return el;
    }

    removeElement(id: string): void {
        const el = document.getElementById(id);
        el?.remove();
    }

    applyLoc(locale: PluginManifestLocale, data: ArrayBuffer): Promise<void> {
        return Promise.resolve().then(() => {
            const text = kdbxweb.ByteUtils.bytesToString(data);
            const localeData = JSON.parse(text) as Record<string, string>;
            SettingsManager.allLocales[locale.name] = locale.title;
            SettingsManager.customLocales.set(locale.name, localeData);
            this.logger.info('Plugin locale installed');
        });
    }

    removeLoc(locale: PluginManifestLocale): void {
        delete SettingsManager.allLocales[locale.name];
        SettingsManager.customLocales.delete(locale.name);
        if (Locale.localeName === locale.name) {
            AppSettings.locale = 'en-US';
            // TODO: switch to this locale
        }
    }

    getThemeLocaleKey(name: string): string {
        return `setGenThemeCustom_${name}`;
    }

    removeTheme(theme: PluginManifestTheme): void {
        delete SettingsManager.allThemes[theme.name];
        if (AppSettings.theme === theme.name) {
            AppSettings.theme = SettingsManager.getDefaultTheme();
        }
        SettingsManager.customThemeNames.delete(this.getThemeLocaleKey(theme.name));
    }

    loadPluginSettings(): void {
        if (!this.module || !this.module.exports || !this.module.exports.setSettings) {
            return;
        }
        const ts = this.logger.ts();
        const settingPrefix = this.getSettingPrefix();
        let settings: Record<string, unknown> | undefined;
        for (const [key, value] of Object.entries(RuntimeData)) {
            if (key.startsWith(settingPrefix)) {
                if (!settings) {
                    settings = {};
                }
                settings[key.replace(settingPrefix, '')] = value;
            }
        }
        if (settings) {
            this.setSettings(settings);
        }
        this.logger.info('Plugin settings loaded', this.logger.ts(ts));
    }

    uninstallPluginCode(): void {
        if (
            this.manifest.resources.js &&
            this.module &&
            this.module.exports &&
            typeof this.module.exports.uninstall === 'function'
        ) {
            try {
                this.module.exports.uninstall();
            } catch (e) {
                this.logger.error('Plugin uninstall method returned an error', e);
            }
        }
    }

    uninstall(): Promise<void> {
        const ts = this.logger.ts();
        return this.disable().then(() => {
            return this.deleteResources().then(() => {
                this.status = undefined;
                this.logger.info('Uninstall complete', this.logger.ts(ts));
            });
        });
    }

    disable(): Promise<void> {
        const manifest = this.manifest;
        this.logger.info(
            'Disabling plugin with resources',
            Object.keys(manifest.resources).join(', ')
        );
        this.status = 'uninstalling';
        const ts = this.logger.ts();
        return Promise.resolve().then(() => {
            if (manifest.resources.css) {
                this.removeElement('plugin-css-' + this.name);
            }
            if (manifest.resources.js) {
                this.uninstallPluginCode();
            }
            if (manifest.resources.loc && this.manifest.locale) {
                this.removeLoc(this.manifest.locale);
            }
            if (manifest.theme) {
                this.removeTheme(manifest.theme);
            }
            this.status = 'inactive';
            this.logger.info('Disable complete', this.logger.ts(ts));
        });
    }

    update(newPlugin: Plugin): Promise<void> {
        const ts = this.logger.ts();
        const prevStatus = this.status;
        this.status = 'updating';
        return Promise.resolve().then(() => {
            const manifest = this.manifest;
            const newManifest = newPlugin.manifest;
            if (manifest.version === newManifest.version) {
                this.batchSet(() => {
                    this.status = prevStatus;
                    this.updateCheckDate = new Date();
                    this.updateError = undefined;
                });
                this.logger.info(`v${manifest.version} is the latest plugin version`);
                return;
            }
            this.logger.info(
                `Updating plugin from v${manifest.version} to v${newManifest.version}`
            );
            const error = newPlugin.validateManifest() || this.validateUpdatedManifest(newManifest);
            if (error) {
                this.logger.error('Manifest validation error', error);
                this.batchSet(() => {
                    this.status = prevStatus;
                    this.updateCheckDate = new Date();
                    this.updateError = error;
                });
                throw new Error('Plugin validation error: ' + error);
            }
            this.uninstallPluginCode();
            return newPlugin
                .installWithManifest(false)
                .then(() => {
                    this.module = newPlugin.module;
                    this.resources = newPlugin.resources;
                    this.batchSet(() => {
                        this.status = 'active';
                        this.manifest = newManifest;
                        this.installTime = this.logger.ts() - ts;
                        this.installError = undefined;
                        this.updateCheckDate = new Date();
                        this.updateError = undefined;
                    });
                    this.logger.info('Update complete', this.logger.ts(ts));
                })
                .catch((err) => {
                    this.logger.error('Error updating plugin', err);
                    if (prevStatus === 'active') {
                        this.logger.info('Activating previous version');
                        return this.installWithResources().then(() => {
                            this.batchSet(() => {
                                this.updateCheckDate = new Date();
                                this.updateError = errorToString(err);
                            });
                            throw err;
                        });
                    } else {
                        this.batchSet(() => {
                            this.status = prevStatus;
                            this.updateCheckDate = new Date();
                            this.updateError = errorToString(err);
                        });
                        throw err;
                    }
                });
        });
    }

    getSettingPrefix(): string {
        return `plugin:${this.id}:`;
    }

    getSettings(): PluginSetting[] {
        const result: PluginSetting[] = [];
        if (
            this.status === 'active' &&
            this.module &&
            this.module.exports &&
            typeof this.module.exports.getSettings === 'function'
        ) {
            try {
                const settings = this.module.exports.getSettings() as unknown;
                const settingsPrefix = this.getSettingPrefix();
                if (settings instanceof Array) {
                    for (const setting of settings as unknown[]) {
                        if (!setting || typeof setting !== 'object') {
                            this.logger.error(`getSettings: bad setting`, setting);
                            continue;
                        }
                        const pluginSetting = { ...setting } as PluginSetting;
                        if (!pluginSetting.name || pluginSetting.type) {
                            this.logger.error(`getSettings: bad setting`, setting);
                            continue;
                        }
                        const value = RuntimeData.get(settingsPrefix + pluginSetting.name);
                        if (typeof value === 'string' || typeof value === 'boolean') {
                            pluginSetting.value = value;
                        }
                        result.push(pluginSetting);
                    }
                }
                this.logger.error(`getSettings: expected Array, got ${typeof settings}`);
            } catch (e) {
                this.logger.error('getSettings error', e);
            }
        }
        return result;
    }

    setSettings(settings: Record<string, unknown>): void {
        for (const [key, value] of Object.entries(settings)) {
            RuntimeData.set(this.getSettingPrefix() + key, value);
        }
        if (typeof this.module?.exports.setSettings === 'function') {
            try {
                this.module.exports.setSettings(settings);
            } catch (e) {
                this.logger.error('setSettings error', e);
            }
        }
    }

    static async loadFromUrl(url: string, expectedManifest?: PluginManifest): Promise<Plugin> {
        if (url[url.length - 1] !== '/') {
            url += '/';
        }
        commonLogger.info('Installing plugin from url', url);
        const manifestUrl = url + 'manifest.json';

        let manifestStr: string;
        try {
            manifestStr = await httpGet(manifestUrl, false);
        } catch (e) {
            commonLogger.error('Error loading plugin manifest', e);
            throw new Error('Error loading plugin manifest');
        }

        let manifest: PluginManifest;
        try {
            manifest = JSON.parse(manifestStr) as PluginManifest;
        } catch (e) {
            commonLogger.error('Failed to parse manifest', manifestStr);
            throw new Error('Failed to parse manifest');
        }

        commonLogger.info('Loaded manifest', manifest);
        if (expectedManifest) {
            if (expectedManifest.name !== manifest.name) {
                throw new Error('Bad plugin name');
            }
            if (expectedManifest.publicKey !== manifest.publicKey) {
                throw new Error('Bad plugin public key');
            }
        }
        return new Plugin(url, manifest);
    }
}

function httpGet(url: string, binary: true): Promise<ArrayBuffer>;
function httpGet(url: string, binary: false): Promise<string>;
function httpGet(url: string, binary: boolean): Promise<ArrayBuffer | string> {
    commonLogger.info('GET', url);
    const ts = commonLogger.ts();
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                commonLogger.info('GET OK', url, commonLogger.ts(ts));
                resolve(xhr.response);
            } else {
                commonLogger.info('GET error', url, xhr.status);
                reject(xhr.status ? `HTTP status ${xhr.status}` : 'network error');
            }
        });
        xhr.addEventListener('error', () => {
            commonLogger.info('GET error', url, xhr.status);
            reject(xhr.status ? `HTTP status ${xhr.status}` : 'network error');
        });
        xhr.addEventListener('abort', () => {
            commonLogger.info('GET aborted', url);
            reject('Network request timeout');
        });
        xhr.addEventListener('timeout', () => {
            commonLogger.info('GET timeout', url);
            reject('Network request timeout');
        });
        if (binary) {
            xhr.responseType = binary ? 'arraybuffer' : 'text';
        }
        xhr.open('GET', url);
        xhr.send();
    });
}

export { Plugin };
