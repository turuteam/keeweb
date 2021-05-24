import { Features } from 'util/features';
import { Logger } from 'util/logger';
import { AppSettings, AppSettingsFieldName } from 'models/app-settings';
import { Alerts } from 'comp/ui/alerts';
import { Locale } from 'util/locale';

const logger = new Logger('config-loader');

class ConfigLoader {
    async loadConfig(): Promise<boolean> {
        const configParam = this.getConfigParam();
        if (configParam) {
            try {
                const config = await this.loadFromNetwork(configParam);
                if (!config.settings) {
                    logger.error('Invalid app config, no settings section', config);
                    throw new Error('Invalid app config, no settings section');
                }

                this.applyUserConfig(config);
                return true;
            } catch (e) {
                if (!AppSettings.cacheConfigSettings) {
                    this.showSettingsLoadError();
                    throw e;
                }
            }
        }

        return false;
    }

    private getConfigParam(): string | null {
        const metaConfig = document.head.querySelector('meta[name=kw-config]') as
            | HTMLMetaElement
            | undefined;
        if (metaConfig && metaConfig.content && metaConfig.content[0] !== '(') {
            return metaConfig.content;
        }

        if (!location.search) {
            return null;
        }
        const sp = new URLSearchParams(location.search);
        return sp.get('config');
    }

    private loadFromNetwork(configLocation: string): Promise<Record<string, string>> {
        return new Promise((resolve, reject) => {
            this.ensureCanLoadConfig(configLocation);
            logger.info('Loading config from', configLocation);
            const ts = logger.ts();
            const xhr = new XMLHttpRequest();
            xhr.open('GET', configLocation);
            xhr.responseType = 'json';
            xhr.send();
            xhr.addEventListener('load', () => {
                const response = xhr.response as unknown;
                if (!response || typeof response !== 'object') {
                    const errorDesc = xhr.statusText === 'OK' ? 'Malformed JSON' : xhr.statusText;
                    logger.error('Error loading app config', errorDesc);
                    return reject('Error loading app config');
                }
                logger.info('Loaded app config from', configLocation, logger.ts(ts));
                resolve(response as Record<string, string>);
            });
            xhr.addEventListener('error', () => {
                logger.error('Error loading app config', xhr.statusText, xhr.status);
                reject(new Error('Error loading app config'));
            });
        });
    }

    private ensureCanLoadConfig(url: string) {
        if (!Features.isSelfHosted) {
            throw new Error('Configs are supported only in self-hosted installations');
        }
        const link = document.createElement('a');
        link.href = url;
        const isExternal = link.host && link.host !== location.host;
        if (isExternal) {
            throw new Error('Loading config from this location is not allowed');
        }
    }

    private applyUserConfig(config: Record<string, unknown>): void {
        if (!config.settings) {
            logger.error('Invalid app config, no settings section', config);
            throw new Error('Invalid app config, no settings section');
        }

        const settings = config.settings as Record<string, unknown>;

        for (const [key, value] of Object.entries(settings)) {
            const isSet = AppSettings.set(key as AppSettingsFieldName, value);
            if (!isSet) {
                logger.warn('Invalid setting ignored', key, value);
            }
        }

        if (config.files) {
            // TODO(ts): set files
            // if (config.showOnlyFilesFromConfig) {
            //     this.fileInfos.length = 0;
            // }
            // config.files
            //     .filter(
            //         (file) =>
            //             file &&
            //             file.storage &&
            //             file.name &&
            //             file.path &&
            //             !this.fileInfos.getMatch(file.storage, file.name, file.path)
            //     )
            //     .map(
            //         (file) =>
            //             new FileInfoModel({
            //                 id: IdGenerator.uuid(),
            //                 name: file.name,
            //                 storage: file.storage,
            //                 path: file.path,
            //                 opts: file.options
            //             })
            //     )
            //     .reverse()
            //     .forEach((fi) => this.fileInfos.unshift(fi));
        }

        if (config.plugins) {
            // TODO(ts): set plugins
            // const pluginsPromises = config.plugins.map((plugin) =>
            //     PluginManager.installIfNew(plugin.url, plugin.manifest, true)
            // );
            // return Promise.all(pluginsPromises).then(() => {
            //     this.settings.set(config.settings);
            // });
        }

        if (config.advancedSearch) {
            // TODO(ts): set advanced search
            // this.advancedSearch = config.advancedSearch;
            // this.addFilter({ advanced: this.advancedSearch });
        }
    }

    private showSettingsLoadError() {
        Alerts.error({
            header: Locale.appSettingsError,
            body: Locale.appSettingsErrorBody,
            buttons: [],
            esc: undefined,
            enter: undefined,
            click: undefined
        });
    }
}

const instance = new ConfigLoader();

export { instance as ConfigLoader };
