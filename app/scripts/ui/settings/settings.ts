import { FunctionComponent, h } from 'preact';
import { SettingsView } from 'views/settings/settings-view';
import { useKey, useModelField } from 'util/ui/hooks';
import { Workspace } from 'models/workspace';
import { Keys } from 'const/keys';

export const Settings: FunctionComponent = () => {
    const selectedMenuItem = useModelField(Workspace.menu, 'selectedItem');
    useKey(Keys.DOM_VK_ESCAPE, () => {
        Workspace.toggleSettings();
    });

    const backClicked = () => {
        Workspace.toggleSettings();
    };

    return h(SettingsView, {
        page: selectedMenuItem.page ?? 'general',
        anchor: selectedMenuItem.anchor,
        fileId: selectedMenuItem.file?.id,

        backClicked
    });
};
