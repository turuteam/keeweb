import { FunctionComponent, h } from 'preact';
import { SettingsGeneralAppearanceView } from 'views/settings/general/settings-general-appearance-view';
import { SettingsManager } from 'comp/settings/settings-manager';
import { Locale } from 'util/locale';
import { ThemeWatcher } from 'comp/browser/theme-watcher';
import { AppSettings, AppSettingsFontSize, AppSettingsTitlebarStyle } from 'models/app-settings';
import { Features } from 'util/features';
import { Workspace } from 'models/workspace';

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

    const goToPlugins = () => {
        Workspace.selectMenu(Workspace.menu.pluginsSection.items[0]);
    };

    const localeChanged = (locale: string) => {
        if (locale === '...') {
            goToPlugins();
        } else {
            AppSettings.locale = locale;
            SettingsManager.setLocale(locale);
        }
    };

    const themeChanged = (theme: string) => {
        if (theme === '...') {
            goToPlugins();
        } else {
            const changedInSettings = AppSettings.theme !== theme;
            if (changedInSettings) {
                AppSettings.theme = theme;
            }
            SettingsManager.setTheme(theme);
        }
    };

    const autoSwitchThemeChanged = () => {
        AppSettings.autoSwitchTheme = !AppSettings.autoSwitchTheme;
        SettingsManager.darkModeChanged();
    };

    const fontSizeChanged = (fontSize: AppSettingsFontSize) => {
        AppSettings.fontSize = fontSize;
        SettingsManager.setFontSize(fontSize);
    };

    const titlebarStyleChanged = (titlebarStyle: AppSettingsTitlebarStyle) => {
        AppSettings.titlebarStyle = titlebarStyle;
    };

    const expandGroupsChanged = () => {
        AppSettings.expandGroups = !AppSettings.expandGroups;
    };

    const tableViewChanged = () => {
        AppSettings.tableView = !AppSettings.tableView;
    };

    const colorfulIconsChanged = () => {
        AppSettings.colorfulIcons = !AppSettings.colorfulIcons;
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
        colorfulIcons: AppSettings.colorfulIcons,

        localeChanged,
        themeChanged,
        autoSwitchThemeChanged,
        fontSizeChanged,
        titlebarStyleChanged,
        expandGroupsChanged,
        tableViewChanged,
        colorfulIconsChanged
    });
};
