import { FunctionComponent, h } from 'preact';
import { SettingsGeneralAppearanceView } from 'views/settings/general/settings-general-appearance-view';
import { SettingsManager } from 'comp/settings/settings-manager';
import { Locale } from 'util/locale';
import { ThemeWatcher } from 'comp/browser/theme-watcher';
import { AppSettings } from 'models/app-settings';
import { Features } from 'util/features';

export const SettingsGeneralAppearance: FunctionComponent = () => {
    const getAllThemes = () => {
        const themes: Record<string, string> = {};
        if (AppSettings.autoSwitchTheme) {
            const ignoredThemes = new Set<string>();
            for (const config of SettingsManager.autoSwitchedThemes) {
                ignoredThemes.add(config.dark);
                ignoredThemes.add(config.light);
                const activeTheme = ThemeWatcher.dark ? config.dark : config.light;
                themes[activeTheme] = config.name;
            }
            for (const [th, name] of Object.entries(SettingsManager.allThemes)) {
                if (!ignoredThemes.has(th)) {
                    themes[th] = name;
                }
            }
        } else {
            for (const [th, name] of Object.entries(SettingsManager.allThemes)) {
                themes[th] = name;
            }
        }
        return themes;
    };

    return h(SettingsGeneralAppearanceView, {
        locales: SettingsManager.allLocales,
        activeLocale: Locale.localeName,
        themes: getAllThemes(),
        activeTheme: SettingsManager.activeTheme ?? '',
        autoSwitchTheme: AppSettings.autoSwitchTheme,
        fontSize: AppSettings.fontSize,
        supportsTitleBarStyles: Features.supportsTitleBarStyles,
        titlebarStyle: AppSettings.titlebarStyle,
        supportsCustomTitleBarAndDraggableWindow: Features.supportsCustomTitleBarAndDraggableWindow,
        expandGroups: AppSettings.expandGroups,
        canSetTableView: !Features.isMobile,
        tableView: AppSettings.tableView,
        colorfulIcons: AppSettings.colorfulIcons
    });
};
