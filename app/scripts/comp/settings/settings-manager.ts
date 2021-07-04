import { Events } from 'util/events';
import { Features } from 'util/features';
import { Locale } from 'util/locale';
import { ThemeWatcher } from 'comp/browser/theme-watcher';
import { AppSettings, AppSettingsFontSize } from 'models/app-settings';
import { Logger } from 'util/logger';
import { Launcher } from 'comp/launcher';
import { noop } from 'util/fn';
import { WindowClass } from 'comp/browser/window-class';

const logger = new Logger('settings-manager');

const SettingsManager = {
    activeTheme: null as string | null,

    allLocales: {
        'en-US': 'English',
        'de-DE': 'Deutsch',
        'fr-FR': 'Français'
    } as Record<string, string>,

    get builtInThemes(): Record<string, string> {
        return {
            dark: Locale.setGenThemeDark,
            light: Locale.setGenThemeLight,
            sd: Locale.setGenThemeSd,
            sl: Locale.setGenThemeSl,
            fb: Locale.setGenThemeFb,
            bl: Locale.setGenThemeBl,
            db: Locale.setGenThemeDb,
            lb: Locale.setGenThemeLb,
            te: Locale.setGenThemeTe,
            lt: Locale.setGenThemeLt,
            dc: Locale.setGenThemeDc,
            hc: Locale.setGenThemeHc
        };
    },

    get allThemes(): Record<string, string> {
        return {
            ...this.builtInThemes,
            ...this.customThemes
        };
    },

    // changing something here? don't forget about desktop/app.js
    get autoSwitchedThemes(): { name: string; dark: string; light: string }[] {
        return [
            {
                name: Locale.setGenThemeDefault,
                dark: 'dark',
                light: 'light'
            },
            {
                name: Locale.setGenThemeSol,
                dark: 'sd',
                light: 'sl'
            },
            {
                name: Locale.setGenThemeBlue,
                dark: 'fb',
                light: 'bl'
            },
            {
                name: Locale.setGenThemeBrown,
                dark: 'db',
                light: 'lb'
            },
            {
                name: Locale.setGenThemeTerminal,
                dark: 'te',
                light: 'lt'
            },
            {
                name: Locale.setGenThemeHighContrast,
                dark: 'dc',
                light: 'hc'
            }
        ];
    },

    customLocales: new Map<string, Record<string, string>>(),
    customThemes: {} as Record<string, string>,

    init(): void {
        Events.on('dark-mode-changed', () => this.darkModeChanged());
    },

    setBySettings(): void {
        this.setTheme(AppSettings.theme);
        this.setFontSize(AppSettings.fontSize);
        const locale = AppSettings.locale;
        try {
            if (locale) {
                this.setLocale(AppSettings.locale);
            } else {
                this.setLocale(this.getBrowserLocale());
            }
        } catch (ex) {}
    },

    getDefaultTheme(): string {
        return 'dark';
    },

    setTheme(theme: string | undefined | null): void {
        if (!theme) {
            if (this.activeTheme) {
                return;
            }
            theme = this.getDefaultTheme();
        }
        for (const cls of document.body.classList) {
            if (/^th-/.test(cls)) {
                document.body.classList.remove(cls);
            }
        }
        if (AppSettings.autoSwitchTheme) {
            theme = this.selectDarkOrLightTheme(theme);
        }
        WindowClass.setThemeClass(theme);
        const metaThemeColor = document.head.querySelector('meta[name=theme-color]') as
            | HTMLMetaElement
            | undefined;
        if (metaThemeColor) {
            metaThemeColor.content = window.getComputedStyle(document.body).backgroundColor;
        }
        this.activeTheme = theme;
        logger.info('Theme changed', theme);
        Events.emit('theme-changed');
    },

    selectDarkOrLightTheme(theme: string): string {
        for (const config of this.autoSwitchedThemes) {
            if (config.light === theme || config.dark === theme) {
                return ThemeWatcher.dark ? config.dark : config.light;
            }
        }
        return theme;
    },

    darkModeChanged(): void {
        if (AppSettings.autoSwitchTheme) {
            for (const config of this.autoSwitchedThemes) {
                if (config.light === this.activeTheme || config.dark === this.activeTheme) {
                    const newTheme = ThemeWatcher.dark ? config.dark : config.light;
                    logger.info('Setting theme triggered by system settings change', newTheme);
                    this.setTheme(newTheme);
                    break;
                }
            }
        }
    },

    setFontSize(fontSize: AppSettingsFontSize): void {
        const defaultFontSize = Features.isMobile ? 14 : 12;
        const sizeInPx = defaultFontSize + (fontSize || 0) * 2;
        document.documentElement.style.fontSize = `${sizeInPx}px`;
        WindowClass.setFontSizeClass(fontSize);
    },

    setLocale(loc: string | undefined | null): void {
        if (!loc || loc === Locale.localeName) {
            return;
        }
        if (loc === 'en-US') {
            Locale.set(undefined);
        } else {
            let localeValues = this.customLocales.get(loc);
            if (!localeValues) {
                localeValues = require('locales/' + loc + '.json') as Record<string, string>;
            }
            Locale.set(localeValues, loc);
        }
        Events.emit('locale-changed', loc);

        if (Launcher) {
            const localeValuesForDesktopApp = this.getDesktopAppLocaleValues();
            Launcher.ipcRenderer.invoke('set-locale', loc, localeValuesForDesktopApp).catch(noop);
        }
    },

    getBrowserLocale(): string {
        const language = (navigator.languages && navigator.languages[0]) || navigator.language;
        if (language && language.startsWith('en')) {
            return 'en-US';
        }
        return language;
    },

    getDesktopAppLocaleValues(): Record<string, string> {
        return {
            sysMenuAboutKeeWeb: Locale.sysMenuAboutKeeWeb.with('KeeWeb'),
            sysMenuServices: Locale.sysMenuServices,
            sysMenuHide: Locale.sysMenuHide.with('KeeWeb'),
            sysMenuHideOthers: Locale.sysMenuHideOthers,
            sysMenuUnhide: Locale.sysMenuUnhide,
            sysMenuQuit: Locale.sysMenuQuit.with('KeeWeb'),
            sysMenuEdit: Locale.sysMenuEdit,
            sysMenuUndo: Locale.sysMenuUndo,
            sysMenuRedo: Locale.sysMenuRedo,
            sysMenuCut: Locale.sysMenuCut,
            sysMenuCopy: Locale.sysMenuCopy,
            sysMenuPaste: Locale.sysMenuPaste,
            sysMenuSelectAll: Locale.sysMenuSelectAll,
            sysMenuWindow: Locale.sysMenuWindow,
            sysMenuMinimize: Locale.sysMenuMinimize,
            sysMenuClose: Locale.sysMenuClose
        };
    }
};

export { SettingsManager };
