import { FunctionComponent, h } from 'preact';
import { SettingsView } from 'views/settings/settings-view';
import { useKey, useModelField } from 'util/ui/hooks';
import { Workspace } from 'models/workspace';
import { Keys } from 'const/keys';

export const Settings: FunctionComponent = () => {
    const page = useModelField(Workspace, 'settingsPage');
    useKey(Keys.DOM_VK_ESCAPE, () => {
        Workspace.toggleSettings();
    });

    return h(SettingsView, { page });
};
