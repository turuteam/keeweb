import { FunctionComponent } from 'preact';
import { PluginManifest } from 'plugins/types';
import { Locale } from 'util/locale';

export const SettingsGalleryPluginView: FunctionComponent<{
    hasUnicodeFlags: boolean;
    manifest: PluginManifest;
    official: boolean;
    installing: boolean;
    installError?: string;

    installClicked: () => void;
}> = ({ hasUnicodeFlags, manifest, official, installing, installError, installClicked }) => {
    return (
        <div class="settings__plugins-gallery-plugin">
            <h4 class="settings__plugins-gallery-plugin-title">
                <a
                    href={manifest.url}
                    target="_blank"
                    class="settings__plugins-gallery-plugin-title-link"
                    rel="noreferrer"
                >
                    {manifest.name}
                </a>
            </h4>
            {hasUnicodeFlags && manifest.locale?.flag ? (
                <div class="settings__plugins-gallery-plugin-country-flag">
                    {manifest.locale.flag}
                </div>
            ) : null}
            <div class="settings__plugins-gallery-plugin-desc">{manifest.description}</div>
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
                        <i class="fa fa-language" /> {Locale.setPlLoc}: {manifest.locale?.title}
                    </li>
                ) : null}
            </ul>
            <div class="settings__plugins-gallery-plugin-author muted-color">
                {official ? (
                    <>
                        <i class="fa fa-check" /> {Locale.setPlOfficial}
                    </>
                ) : (
                    <>
                        <i class="fa fa-at" />{' '}
                        <a href={manifest.author.url} target="_blank" rel="noreferrer">
                            {manifest.author.name}
                        </a>{' '}
                        ({manifest.author.email})
                    </>
                )}
            </div>
            {installError ? <div class="error-color">{installError}</div> : null}
            <button
                class="settings__plugins-gallery-plugin-install-btn"
                disabled={installing}
                onClick={installClicked}
            >
                {installing ? Locale.setPlInstallBtnProgress + '...' : Locale.setPlInstallBtn}
            </button>
        </div>
    );
};
