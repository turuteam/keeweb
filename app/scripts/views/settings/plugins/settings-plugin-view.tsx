import { FunctionComponent } from 'preact';
import { PluginManifest, PluginSetting } from 'plugins/types';
import { PluginStatus } from 'plugins/plugin';
import { Locale } from 'util/locale';
import { LocalizedWith } from 'views/components/localized-with';

export const SettingsPluginView: FunctionComponent<{
    hasUnicodeFlags: boolean;
    id: string;
    manifest: PluginManifest;
    status?: PluginStatus;
    installTime?: number;
    updateError?: string;
    updateCheckDate?: string;
    installError?: string;
    autoUpdate: boolean;
    settings: PluginSetting[];

    uninstallClicked: () => void;
    disableClicked: () => void;
    enableClicked: () => void;
    updateClicked: () => void;
    autoUpdateChanged: () => void;
    useLocaleClicked: () => void;
    useThemeClicked: () => void;
    pluginSettingChanged: (key: string, value: string | boolean) => void;
}> = ({
    hasUnicodeFlags,
    id,
    manifest,
    status,
    installTime,
    updateError,
    updateCheckDate,
    installError,
    autoUpdate,
    settings,

    uninstallClicked,
    disableClicked,
    enableClicked,
    updateClicked,
    autoUpdateChanged,
    useLocaleClicked,
    useThemeClicked,
    pluginSettingChanged
}) => {
    return (
        <div class="settings__plugins-plugin" id={`settings__plugins-plugin--${id}`}>
            <h2>{id}</h2>
            <div>{manifest.description}</div>
            <div>
                <ul class="settings__plugins-plugin-files">
                    {manifest.resources.js ? (
                        <li class="settings__plugins-plugin-file">
                            <i class="fa fa-code" /> {Locale.setPlJs}
                        </li>
                    ) : null}
                    {manifest.resources.css ? (
                        <li class="settings__plugins-plugin-file">
                            <i class="fa fa-paint-brush" /> {Locale.setPlCss}
                        </li>
                    ) : null}
                    {manifest.resources.loc ? (
                        <li class="settings__plugins-plugin-file">
                            <i class="fa fa-language" />
                            &nbsp;
                            {Locale.setPlLoc}: {manifest.locale?.title}
                            {hasUnicodeFlags ? manifest.locale?.flag ?? ' ' : ''}
                        </li>
                    ) : null}
                </ul>
            </div>
            <div class="settings__plugins-plugin-desc">
                <a href={manifest.url} target="_blank" rel="noreferrer">
                    {manifest.url}
                </a>
                , v{manifest.version}.{' '}
                {manifest.author.name === 'KeeWeb' ? (
                    Locale.setPlOfficial
                ) : (
                    <LocalizedWith str={Locale.setPlCreatedBy}>
                        <a href={manifest.author.url} target="_blank" rel="noreferrer">
                            {manifest.author.name}
                        </a>{' '}
                        ({manifest.author.email})
                    </LocalizedWith>
                )}
                ,{' '}
                {status === 'active' ? (
                    <LocalizedWith str={Locale.setPlLoadTime}>{installTime}ms</LocalizedWith>
                ) : status === 'error' ? (
                    <span class="error-color">&nbsp;{Locale.setPlLoadError}</span>
                ) : (
                    status
                )}
                {updateCheckDate ? (
                    <div>
                        {Locale.setPlLastUpdate}: {updateCheckDate}
                    </div>
                ) : null}
                {installError ? (
                    <div class="error-color settings__plugins-install-error">
                        <pre>{installError}</pre>
                    </div>
                ) : null}
                {updateError ? (
                    <div class="error-color settings__plugins-install-error">
                        <pre>{updateError}</pre>
                    </div>
                ) : null}
            </div>
            <div class="settings__plugins-plugin-updates">
                <input
                    type="checkbox"
                    class="settings__plugins-plugin-update-check settings__input input-base"
                    id={`plugin-${id}-auto-update`}
                    checked={autoUpdate}
                    onClick={autoUpdateChanged}
                />
                <label for={`plugin-${id}-auto-update`}>{Locale.setPlAutoUpdate}</label>
            </div>
            {settings ? (
                <div class="settings__plugins-plugin-settings">
                    {settings.map((setting) => (
                        <div key={setting.name} class="settings__plugins-plugin-setting">
                            {setting.type === 'checkbox' ? (
                                <input
                                    type="checkbox"
                                    class="settings__plugins-plugin-input settings__input input-base"
                                    id={`plugin-${id}-setting-${setting.name}`}
                                    checked={!!setting.value}
                                    onClick={(e) =>
                                        pluginSettingChanged(
                                            setting.name,
                                            (e.target as HTMLInputElement).checked
                                        )
                                    }
                                />
                            ) : null}
                            <label
                                class="settings__plugins-plugin-label"
                                for={`plugin-${id}-setting-${setting.name}`}
                            >
                                {setting.label}
                            </label>
                            {setting.type === 'text' ? (
                                <input
                                    type="text"
                                    class="settings__plugins-plugin-input settings__input input-base"
                                    id={`plugin-${id}-setting-${setting.name}`}
                                    placeholder={setting.placeholder}
                                    maxLength={setting.maxlength}
                                    value={String(setting.value || '')}
                                    onInput={(e) =>
                                        pluginSettingChanged(
                                            setting.name,
                                            (e.target as HTMLInputElement).value
                                        )
                                    }
                                />
                            ) : null}
                            {setting.type === 'select' && setting.options ? (
                                <select
                                    class="settings__plugins-plugin-input settings__select input-base"
                                    id={`plugin-${id}-setting-${setting.name}`}
                                    value={String(setting.value || '')}
                                    onChange={(e) =>
                                        pluginSettingChanged(
                                            setting.name,
                                            (e.target as HTMLSelectElement).value
                                        )
                                    }
                                >
                                    {setting.options.map((opt) => (
                                        <option key={opt.label} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : null}
            <div class="settings__plugins-plugin-buttons">
                <button class="settings_plugins-uninstall-btn btn-error" onClick={uninstallClicked}>
                    {Locale.setPlUninstallBtn}
                </button>
                {status === 'active' ? (
                    <button
                        class="settings_plugins-disable-btn btn-silent"
                        onClick={disableClicked}
                    >
                        {Locale.setPlDisableBtn}
                    </button>
                ) : null}
                {status === 'inactive' ? (
                    <button class="settings_plugins-enable-btn btn-silent" onClick={enableClicked}>
                        {Locale.setPlEnableBtn}
                    </button>
                ) : null}
                <button class="settings_plugins-update-btn btn-silent" onClick={updateClicked}>
                    {Locale.setPlUpdateBtn}
                </button>
                {status === 'active' ? (
                    <>
                        {manifest.locale ? (
                            <button
                                class="settings_plugins-use-locale-btn btn-silent"
                                onClick={useLocaleClicked}
                            >
                                {Locale.setPlLocaleBtn}
                            </button>
                        ) : null}
                        {manifest.theme ? (
                            <button
                                class="settings_plugins-use-theme-btn btn-silent"
                                onClick={useThemeClicked}
                            >
                                {Locale.setPlThemeBtn}
                            </button>
                        ) : null}
                    </>
                ) : null}
            </div>
        </div>
    );
};
