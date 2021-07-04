import { FunctionComponent, h } from 'preact';
import { useModelWatcher } from 'util/ui/hooks';
import { Plugin } from 'plugins/plugin';
import { SettingsPluginView } from 'views/settings/plugins/settings-plugin-view';
import { DateFormat } from 'util/formatting/date-format';
import { Features } from 'util/features';
import { PluginManager } from 'plugins/plugin-manager';
import { noop } from 'util/fn';
import { AppSettings } from 'models/app-settings';
import { SettingsManager } from 'comp/settings/settings-manager';

export const SettingsPlugin: FunctionComponent<{ plugin: Plugin }> = ({ plugin }) => {
    useModelWatcher(plugin);

    const uninstallClicked = () => {
        PluginManager.uninstall(plugin.id).catch(noop);
    };

    const disableClicked = () => {
        PluginManager.disable(plugin.id).catch(noop);
    };

    const enableClicked = () => {
        PluginManager.activate(plugin.id).catch(noop);
    };

    const updateClicked = () => {
        PluginManager.update(plugin.id).catch(noop);
    };

    const autoUpdateChanged = () => {
        PluginManager.setAutoUpdate(plugin.id, !plugin.autoUpdate).catch(noop);
    };

    const useLocaleClicked = () => {
        if (plugin.manifest.locale?.name) {
            AppSettings.locale = plugin.manifest.locale.name;
            SettingsManager.setLocale(plugin.manifest.locale.name);
        }
    };

    const useThemeClicked = () => {
        if (plugin.manifest.theme?.name) {
            AppSettings.theme = plugin.manifest.theme.name;
            SettingsManager.setTheme(plugin.manifest.theme.name);
        }
    };

    const pluginSettingChanged = (key: string, value: string | boolean) => {
        plugin.setSettings({ [key]: value });
    };

    return h(SettingsPluginView, {
        hasUnicodeFlags: Features.hasUnicodeFlags,
        id: plugin.id,
        manifest: plugin.manifest,
        status: plugin.status,
        installTime: plugin.installTime ? Math.round(plugin.installTime) : undefined,
        updateError: plugin.updateError,
        updateCheckDate: plugin.updateCheckDate
            ? DateFormat.dtStr(plugin.updateCheckDate)
            : undefined,
        installError: plugin.installError,
        autoUpdate: plugin.autoUpdate,
        settings: plugin.getSettings(),

        uninstallClicked,
        disableClicked,
        enableClicked,
        updateClicked,
        autoUpdateChanged,
        useLocaleClicked,
        useThemeClicked,
        pluginSettingChanged
    });
};
