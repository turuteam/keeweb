import { FunctionComponent, h } from 'preact';
import { PluginGalleryPlugin } from 'plugins/types';
import { SettingsGalleryPluginView } from 'views/settings/plugins/settings-gallery-plugin-view';
import { Features } from 'util/features';
import { PluginManager } from 'plugins/plugin-manager';
import { noop } from 'util/fn';

export const SettingsGalleryPlugin: FunctionComponent<{ plugin: PluginGalleryPlugin }> = ({
    plugin
}) => {
    const installClicked = () => {
        PluginManager.install(plugin.url, plugin.manifest).catch(noop);
    };

    return h(SettingsGalleryPluginView, {
        hasUnicodeFlags: Features.hasUnicodeFlags,
        manifest: plugin.manifest,
        official: plugin.official,
        installing: PluginManager.installing.has(plugin.url),
        installError: PluginManager.installErrors.get(plugin.url),

        installClicked
    });
};
