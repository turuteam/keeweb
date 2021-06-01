import { FunctionComponent } from 'preact';
import { SettingsPage } from 'models/workspace';
import { Scrollable } from 'views/components/scrollable';
import { Locale } from 'util/locale';

export const SettingsView: FunctionComponent<{
    page: SettingsPage;
    anchor?: string;
    fileId?: string;

    backClicked: () => void;
}> = ({ page, anchor, fileId, backClicked }) => {
    return (
        <div class="settings">
            <div class="settings__back-button" onClick={backClicked}>
                <i class="fa fa-chevron-left settings__back-button-pre" />
                {Locale.retToApp} <i class="fa fa-arrow-circle-left settings__back-button-post" />
            </div>
            <Scrollable>
                <p>page: {page}</p>
                <p>anchor: {anchor}</p>
                <p>file: {fileId}</p>
            </Scrollable>
        </div>
    );
};
