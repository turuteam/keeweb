import { Model } from 'util/model';
import { RuntimeInfo } from 'const/runtime-info';
import { SettingsStore } from 'comp/settings/settings-store';
import { Plugin, PluginStatus } from 'plugins/plugin';
import { PluginGallery } from 'plugins/plugin-gallery';
import { SignatureVerifier } from 'util/data/signature-verifier';
import { Logger } from 'util/logger';
import { PluginGalleryData, PluginManifest, StoredPlugin, StoredPlugins } from 'plugins/types';
import { Timeouts } from 'const/timeouts';
import { errorToString } from 'util/fn';

const logger = new Logger('plugin-mgr');

class PluginManager extends Model {
    plugins: Plugin[] = [];
    autoUpdateAppVersion?: string;
    autoUpdateDate?: Date;

    installing = new Set<string>();
    installErrors = new Map<string, string>();

    async init() {
        const ts = logger.ts();
        const storedPlugins = (await SettingsStore.load('plugins')) as StoredPlugins;
        if (!storedPlugins) {
            return;
        }
        this.batchSet(() => {
            this.autoUpdateAppVersion = storedPlugins.autoUpdateAppVersion;
            this.autoUpdateDate = storedPlugins.autoUpdateDate
                ? new Date(storedPlugins.autoUpdateDate)
                : undefined;
        });

        if (!storedPlugins.plugins?.length) {
            return;
        }
        const gallery = await PluginGallery.getCachedGallery();
        const promises = storedPlugins.plugins.map((plugin) => this.loadPlugin(plugin, gallery));
        const loadedPlugins = await Promise.all(promises);

        this.plugins = this.plugins.concat(...loadedPlugins);
        logger.info(`Loaded ${loadedPlugins.length} plugins`, logger.ts(ts));
    }

    async install(
        url: string,
        expectedManifest?: PluginManifest,
        skipSignatureValidation?: boolean
    ): Promise<void> {
        this.installErrors.delete(url);
        this.installing = new Set(this.installing).add(url);
        try {
            const plugin = await Plugin.loadFromUrl(url, expectedManifest);
            await this.uninstall(plugin.id);
            if (skipSignatureValidation) {
                plugin.skipSignatureValidation = true;
            }
            await plugin.install(true, false);
            this.plugins = this.plugins.concat(plugin);

            this.installErrors.delete(url);
        } catch (e) {
            this.installErrors.set(url, errorToString(e));
        } finally {
            const installing = new Set(this.installing);
            installing.delete(url);
            this.installing = installing;
        }
        await this.saveState();
    }

    installIfNew(
        url: string,
        expectedManifest?: PluginManifest,
        skipSignatureValidation?: boolean
    ) {
        const plugin = this.plugins.find((p) => p.url === url);
        if (plugin && plugin.status !== 'invalid') {
            return Promise.resolve();
        }
        return this.install(url, expectedManifest, skipSignatureValidation);
    }

    async uninstall(id: string): Promise<void> {
        const plugin = this.getPlugin(id);
        if (!plugin) {
            return Promise.resolve();
        }
        await plugin.uninstall();
        this.plugins = this.plugins.filter((p) => p.id !== id);
        await this.saveState();
    }

    async disable(id: string): Promise<void> {
        const plugin = this.getPlugin(id);
        if (!plugin || plugin.status !== 'active') {
            return Promise.resolve();
        }
        await plugin.disable();
        await this.saveState();
    }

    async activate(id: string): Promise<void> {
        const plugin = this.getPlugin(id);
        if (!plugin || plugin.status === 'active') {
            return Promise.resolve();
        }
        await plugin.install(true, true);
        await this.saveState();
    }

    async update(id: string): Promise<void> {
        const oldPlugin = this.getPlugin(id);
        const validStatuses: PluginStatus[] = ['active', 'inactive', 'error', 'invalid'];
        if (!oldPlugin || (oldPlugin.status && !validStatuses.includes(oldPlugin.status))) {
            return Promise.reject();
        }
        const url = oldPlugin.url;
        const newPlugin = await Plugin.loadFromUrl(url);
        await oldPlugin.update(newPlugin);
        await this.saveState();
    }

    async setAutoUpdate(id: string, enabled: boolean): Promise<void> {
        const plugin = this.getPlugin(id);
        if (!plugin || plugin.autoUpdate === enabled) {
            return;
        }
        plugin.autoUpdate = enabled;
        await this.saveState();
    }

    async runAutoUpdate(): Promise<void> {
        const queue = this.plugins.filter((p) => p.autoUpdate).map((p) => p.id);
        if (!queue.length) {
            return Promise.resolve();
        }
        const anotherVersion = this.autoUpdateAppVersion !== RuntimeInfo.version;
        const wasLongAgo =
            !this.autoUpdateDate ||
            Date.now() - this.autoUpdateDate.getTime() > Timeouts.PluginsUpdate;
        const autoUpdateRequired = anotherVersion || wasLongAgo;
        if (!autoUpdateRequired) {
            return;
        }
        logger.info('Auto-updating plugins', queue.join(', '));
        this.batchSet(() => {
            this.autoUpdateAppVersion = RuntimeInfo.version;
            this.autoUpdateDate = new Date();
        });
        await this.saveState();

        while (queue.length) {
            const pluginId = queue.shift();
            if (!pluginId) {
                break;
            }
            try {
                await this.update(pluginId);
            } catch (e) {
                logger.error(`Error updating plugin`, pluginId);
            }
        }
    }

    async loadPlugin(desc: StoredPlugin, gallery: PluginGalleryData | undefined): Promise<Plugin> {
        const plugin = new Plugin(desc.url, desc.manifest, desc.autoUpdate);
        let enabled = desc.enabled;
        if (enabled) {
            const galleryPlugin = gallery
                ? gallery.plugins.find((pl) => pl.manifest.name === desc.manifest.name)
                : null;
            const expectedPublicKeys = galleryPlugin
                ? [galleryPlugin.manifest.publicKey]
                : SignatureVerifier.getPublicKeys();
            enabled = expectedPublicKeys.includes(desc.manifest.publicKey);
        }
        return plugin
            .install(enabled, true)
            .then(() => plugin)
            .catch(() => plugin);
    }

    async saveState() {
        await SettingsStore.save('plugins', {
            autoUpdateAppVersion: this.autoUpdateAppVersion,
            autoUpdateDate: this.autoUpdateDate,
            plugins: this.plugins.map((plugin) => ({
                manifest: plugin.manifest,
                url: plugin.url,
                enabled: plugin.status === 'active',
                autoUpdate: plugin.autoUpdate
            }))
        });
    }

    getStatus(id: string): PluginStatus | undefined {
        return this.getPlugin(id)?.status;
    }

    getPlugin(id: string): Plugin | undefined {
        return this.plugins.find((p) => p.id === id);
    }
}

const instance = new PluginManager();

export { instance as PluginManager };
