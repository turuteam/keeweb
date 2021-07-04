import { FunctionComponent } from 'preact';
import { SettingsPage } from 'models/workspace';
import { Scrollable } from 'views/components/scrollable';
import { Locale } from 'util/locale';
import { SettingsGeneral } from 'ui/settings/settings-general';
import { SettingsShortcuts } from 'ui/settings/settings-shortcuts';
import { SettingsPlugins } from 'ui/settings/settings-plugins';
import { SettingsAbout } from 'ui/settings/settings-about';
import { SettingsHelp } from 'ui/settings/settings-help';

export const SettingsView: FunctionComponent<{
    page: SettingsPage;

    backClicked: () => void;
}> = ({ page, backClicked }) => {
    return (
        <div class="settings">
            <div class="settings__back-button" onClick={backClicked}>
                <i class="fa fa-chevron-left settings__back-button-pre" />
                {Locale.retToApp} <i class="fa fa-arrow-circle-left settings__back-button-post" />
            </div>
            <Scrollable>
                {page === 'general' ? <SettingsGeneral /> : null}
                {page === 'shortcuts' ? <SettingsShortcuts /> : null}
                {page === 'plugins' ? <SettingsPlugins /> : null}
                {page === 'about' ? <SettingsAbout /> : null}
                {page === 'help' ? <SettingsHelp /> : null}
            </Scrollable>
        </div>
    );
};
