import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { AppSettingsFontSize, AppSettingsTitlebarStyle } from 'models/app-settings';
import { classes } from 'util/ui/classes';

export const SettingsGeneralAppearanceView: FunctionComponent<{
    locales: Record<string, string>;
    activeLocale: string;
    themes: Record<string, string>;
    activeTheme: string;
    autoSwitchTheme: boolean;
    fontSize: AppSettingsFontSize;
    supportsTitleBarStyles: boolean;
    titlebarStyle: AppSettingsTitlebarStyle;
    supportsCustomTitleBarAndDraggableWindow: boolean;
    expandGroups: boolean;
    canSetTableView: boolean;
    tableView: boolean;
    colorfulIcons: boolean;

    localeChanged: (locale: string) => void;
    themeChanged: (theme: string) => void;
    autoSwitchThemeChanged: () => void;
    fontSizeChanged: (fontSize: AppSettingsFontSize) => void;
    titlebarStyleChanged: (titlebarStyle: AppSettingsTitlebarStyle) => void;
    expandGroupsChanged: () => void;
    tableViewChanged: () => void;
    colorfulIconsChanged: () => void;
}> = ({
    locales,
    activeLocale,
    themes,
    activeTheme,
    autoSwitchTheme,
    fontSize,
    supportsTitleBarStyles,
    titlebarStyle,
    supportsCustomTitleBarAndDraggableWindow,
    expandGroups,
    canSetTableView,
    tableView,
    colorfulIcons,

    localeChanged,
    themeChanged,
    autoSwitchThemeChanged,
    fontSizeChanged,
    titlebarStyleChanged,
    expandGroupsChanged,
    tableViewChanged,
    colorfulIconsChanged
}) => {
    return (
        <>
            <h2 id="appearance">{Locale.setGenAppearance}</h2>
            <div>
                <label for="settings__general-locale">{Locale.setGenLocale}:</label>
                <select
                    class="settings__general-locale settings__select input-base"
                    id="settings__general-locale"
                    value={activeLocale}
                    onChange={(e) => localeChanged((e.target as HTMLSelectElement).value)}
                >
                    {Object.entries(locales).map(([key, name]) => (
                        <option key={key} value={key}>
                            {name}
                        </option>
                    ))}
                    <option value="...">({Locale.setGenLocOther})</option>
                </select>
            </div>

            <div>
                <label>{Locale.setGenTheme}:</label>
                <div class="settings__general-themes">
                    {Object.entries(themes).map(([key, name]) => (
                        <div
                            key={key}
                            class={classes({
                                [`th-${key}`]: true,
                                'settings__general-theme': true,
                                'settings__general-theme--selected': key === activeTheme
                            })}
                            onClick={() => themeChanged(key)}
                        >
                            <div class="settings__general-theme-name">{name}</div>
                            <button class="settings__general-theme-button">
                                <i class="fa fa-ellipsis-h" />
                            </button>
                        </div>
                    ))}
                    <div
                        class="settings__general-theme settings__general-theme-plugins"
                        onClick={() => themeChanged('...')}
                    >
                        <div class="settings__general-theme-plugins-name">
                            {Locale.setGenMoreThemes}
                        </div>
                        <i class="settings__general-theme-plugins-icon fa fa-puzzle-piece" />
                    </div>
                </div>
            </div>
            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-auto-switch-theme"
                    id="settings__general-auto-switch-theme"
                    checked={autoSwitchTheme}
                    onClick={autoSwitchThemeChanged}
                />
                <label for="settings__general-auto-switch-theme">
                    {Locale.setGenAutoSwitchTheme}
                </label>
            </div>
            <div>
                <label for="settings__general-font-size">{Locale.setGenFontSize}:</label>
                <select
                    class="settings__general-font-size settings__select input-base"
                    id="settings__general-font-size"
                    value={fontSize}
                    onChange={(e) =>
                        fontSizeChanged(
                            +(e.target as HTMLSelectElement).value as AppSettingsFontSize
                        )
                    }
                >
                    <option value="0">{Locale.setGenFontSizeNormal}</option>
                    <option value="1">{Locale.setGenFontSizeLarge}</option>
                    <option value="2">{Locale.setGenFontSizeLargest}</option>
                </select>
            </div>
            {supportsTitleBarStyles ? (
                <>
                    <div>
                        <label for="settings__general-titlebar-style">
                            {Locale.setGenTitlebarStyle}:
                        </label>
                        <select
                            class="settings__general-titlebar-style settings__select input-base"
                            id="settings__general-titlebar-style"
                            value={titlebarStyle}
                            onChange={(e) =>
                                titlebarStyleChanged(
                                    (e.target as HTMLSelectElement)
                                        .value as AppSettingsTitlebarStyle
                                )
                            }
                        >
                            <option value="default">{Locale.setGenTitlebarStyleDefault}</option>
                            <option value="hidden">{Locale.setGenTitlebarStyleHidden}</option>
                            {supportsCustomTitleBarAndDraggableWindow ? (
                                <option value="hidden-inset">
                                    {Locale.setGenTitlebarStyleHiddenInset}
                                </option>
                            ) : null}
                        </select>
                    </div>
                </>
            ) : null}
            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-expand"
                    id="settings__general-expand"
                    checked={expandGroups}
                    onClick={expandGroupsChanged}
                />
                <label for="settings__general-expand">{Locale.setGenShowSubgroups}</label>
            </div>
            {canSetTableView ? (
                <>
                    <div>
                        <input
                            type="checkbox"
                            class="settings__input input-base settings__general-table-view"
                            id="settings__general-table-view"
                            checked={tableView}
                            onClick={tableViewChanged}
                        />
                        <label for="settings__general-table-view">{Locale.setGenTableView}</label>
                    </div>
                </>
            ) : null}
            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-colorful-icons"
                    id="settings__general-colorful-icons"
                    checked={colorfulIcons}
                    onClick={colorfulIconsChanged}
                />
                <label for="settings__general-colorful-icons">{Locale.setGenColorfulIcons}</label>
            </div>
        </>
    );
};
