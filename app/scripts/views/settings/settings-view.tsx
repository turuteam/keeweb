import { FunctionComponent } from 'preact';
import { SettingsPage } from 'models/workspace';
import { Scrollable } from 'views/components/scrollable';
import { Locale } from 'util/locale';
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
                {page === 'about' ? <SettingsAbout /> : null}
                {page === 'help' ? <SettingsHelp /> : null}
            </Scrollable>
        </div>
    );
};
