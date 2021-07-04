import { FunctionComponent, h } from 'preact';
import { SettingsPluginsView } from 'views/settings/settings-plugins-view';
import { useModelWatcher } from 'util/ui/hooks';
import { AppSettings } from 'models/app-settings';
import { PluginManager } from 'plugins/plugin-manager';
import { useState } from 'preact/hooks';
import { PluginGallery } from 'plugins/plugin-gallery';
import { noop } from 'util/fn';
import { PluginGalleryPlugin } from 'plugins/types';
import { SettingsManager } from 'comp/settings/settings-manager';
import { Launcher } from 'comp/launcher';
import { SemVer } from 'util/data/semver';
import { RuntimeInfo } from 'const/runtime-info';

function pluginMatchesFilter(searchStr: string, plugin: PluginGalleryPlugin): boolean {
    const manifest = plugin.manifest;
    return !!(
        !searchStr ||
        manifest.name.toLowerCase().indexOf(searchStr) >= 0 ||
        (manifest.description && manifest.description.toLowerCase().indexOf(searchStr) >= 0) ||
        (manifest.locale &&
            (manifest.locale.name.toLowerCase().indexOf(searchStr) >= 0 ||
                manifest.locale.title.toLowerCase().indexOf(searchStr) >= 0))
    );
}

function canInstallPlugin(plugin: PluginGalleryPlugin): boolean {
    if (plugin.manifest.locale && SettingsManager.allLocales[plugin.manifest.locale.name]) {
        return false;
    }
    if (plugin.manifest.desktop && !Launcher) {
        return false;
    }
    if (
        plugin.manifest.versionMin &&
        SemVer.compareVersions(plugin.manifest.versionMin, RuntimeInfo.version) > 0
    ) {
        return false;
    }
    if (
        plugin.manifest.versionMax &&
        SemVer.compareVersions(plugin.manifest.versionMax, RuntimeInfo.version) > 0
    ) {
        return false;
    }
    return true;
}

export const SettingsPlugins: FunctionComponent = () => {
    useModelWatcher(AppSettings);
    useModelWatcher(PluginManager);
    useModelWatcher(PluginGallery);

    const [gallerySearchStr, setGallerySearchStr] = useState('');
    const [installUrl, setInstallUrl] = useState('');
    const [installUrlMalformed, setInstallUrlMalformed] = useState(false);

    const loadGalleryClicked = () => {
        if (!PluginGallery.loading) {
            PluginGallery.loadPlugins().catch(noop);
        }
    };

    const gallerySearchChanged = (text: string) => {
        setGallerySearchStr(text);
    };

    const filter = gallerySearchStr.toLowerCase();
    const galleryPlugins = PluginGallery.gallery?.plugins
        ?.filter((plugin) => canInstallPlugin(plugin))
        ?.filter((plugin) => pluginMatchesFilter(filter, plugin))
        ?.sort((x, y) => x.manifest.name.localeCompare(y.manifest.name));

    const installUrlChanged = (url: string) => {
        setInstallUrl(url);
        if (url) {
            try {
                const isHTTPS = new URL(url).protocol === 'https:';
                setInstallUrlMalformed(!isHTTPS);
            } catch {
                setInstallUrlMalformed(true);
            }
        } else {
            setInstallUrlMalformed(false);
        }
    };

    const installFromUrlClicked = () => {
        PluginManager.install(installUrl).catch(noop);
    };

    return h(SettingsPluginsView, {
        plugins: PluginManager.plugins.sort((x, y) => x.id.localeCompare(y.id)),
        galleryLoading: PluginGallery.loading,
        galleryLoadError: PluginGallery.loadError,
        galleryPlugins,
        gallerySearchStr,
        installUrl,
        installingFromUrl: PluginManager.installing.has(installUrl),
        installUrlError: PluginManager.installErrors.get(installUrl),
        installUrlMalformed,

        loadGalleryClicked,
        gallerySearchChanged,
        installUrlChanged,
        installFromUrlClicked
    });
};
