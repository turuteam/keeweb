import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { Links } from 'const/links';
import { LocalizedWith } from 'views/components/localized-with';
import { SettingsPlugin } from 'ui/settings/plugins/settings-plugin';
import { SettingsGalleryPlugin } from 'ui/settings/plugins/settings-gallery-plugin';
import { Plugin } from 'plugins/plugin';
import { PluginGalleryPlugin } from 'plugins/types';
import { classes } from 'util/ui/classes';

export const SettingsPluginsView: FunctionComponent<{
    plugins: Plugin[];
    galleryLoading: boolean;
    galleryLoadError: boolean;
    galleryPlugins?: PluginGalleryPlugin[];
    gallerySearchStr: string;
    installingFromUrl: boolean;
    installUrl?: string;
    installUrlError?: string;
    installUrlMalformed: boolean;

    loadGalleryClicked: () => void;
    gallerySearchChanged: (text: string) => void;
    installUrlChanged: (url: string) => void;
    installFromUrlClicked: () => void;
}> = ({
    plugins,
    galleryLoading,
    galleryLoadError,
    galleryPlugins,
    gallerySearchStr,
    installingFromUrl,
    installUrl,
    installUrlError,
    installUrlMalformed,

    loadGalleryClicked,
    gallerySearchChanged,
    installUrlChanged,
    installFromUrlClicked
}) => {
    return (
        <div class="settings__content">
            <h1>
                <i class="fa fa-puzzle-piece settings__head-icon" /> {Locale.plugins}
            </h1>
            <div>
                {Locale.setPlDevelop}{' '}
                <a href={Links.PluginDevelopStart} target="_blank" rel="noreferrer">
                    {Locale.setPlDevelopStart}
                </a>
                .{' '}
                <LocalizedWith str={Locale.setPlTranslate}>
                    <a href={Links.Translation} target="_blank" rel="noreferrer">
                        {Locale.setPlTranslateLink}
                    </a>
                </LocalizedWith>
                .
            </div>

            <div class="settings__plugins-list">
                {plugins.map((plugin) => (
                    <SettingsPlugin key={plugin.id} plugin={plugin} />
                ))}
            </div>

            <h2>
                {galleryLoading ? Locale.setPlGalleryLoading + '...' : Locale.setPlInstallTitle}
            </h2>
            <div class="settings__plugins-install">
                <div>{Locale.setPlInstallDesc}</div>
                {galleryLoadError ? (
                    <div class="error-color">{Locale.setPlGalleryLoadError}</div>
                ) : null}
                {galleryPlugins ? (
                    <>
                        <input
                            type="text"
                            class="input-base settings__plugins-gallery-search"
                            placeholder={Locale.setPlSearch}
                            value={gallerySearchStr}
                            onInput={(e) =>
                                gallerySearchChanged((e.target as HTMLInputElement).value)
                            }
                        />
                        <div class="settings__plugins-gallery">
                            {galleryPlugins.map((plugin) => (
                                <SettingsGalleryPlugin plugin={plugin} key={plugin.url} />
                            ))}
                        </div>
                    </>
                ) : (
                    <button
                        class="settings__plugins-gallery-load-btn"
                        disabled={galleryLoading}
                        onClick={loadGalleryClicked}
                    >
                        {Locale.setPlLoadGallery}
                    </button>
                )}
            </div>

            <h2>{Locale.setPlInstallUrlTitle}</h2>
            <div class="settings__plugins-install-url">
                <div>{Locale.setPlInstallUrlDesc}</div>
                <label for="settings__plugins-install-url">{Locale.setPlInstallLabel}</label>
                <input
                    type="text"
                    class={classes({
                        'settings__input input-base': true,
                        'input--error': installUrlMalformed
                    })}
                    id="settings__plugins-install-url"
                    disabled={installingFromUrl}
                    value={installUrl}
                    onInput={(e) => installUrlChanged((e.target as HTMLInputElement).value)}
                />
                <button
                    class="settings_plugins-install-btn"
                    disabled={installingFromUrl || !installUrl || installUrlMalformed}
                    onClick={installFromUrlClicked}
                >
                    {installingFromUrl ? Locale.setPlInstallBtnProgress : Locale.setPlInstallBtn}
                </button>
                <div class="error-color settings__plugins-install-error">{installUrlError}</div>
            </div>
        </div>
    );
};
