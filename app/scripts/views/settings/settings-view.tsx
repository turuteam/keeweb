import { FunctionComponent } from 'preact';
import { SettingsPage } from 'models/workspace';

export const SettingsView: FunctionComponent<{
    page: SettingsPage;
}> = ({ page }) => {
    return <div class="settings">{page}</div>;
};
