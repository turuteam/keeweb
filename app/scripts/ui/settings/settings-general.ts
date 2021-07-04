import { FunctionComponent, h } from 'preact';
import { SettingsGeneralView } from 'views/settings/settings-general-view';
import { useModelField, useModelWatcher } from 'util/ui/hooks';
import { AppSettings } from 'models/app-settings';
import { Workspace } from 'models/workspace';

export const SettingsGeneral: FunctionComponent = () => {
    useModelWatcher(AppSettings);
    const selectedItem = useModelField(Workspace.menu, 'selectedItem');

    return h(SettingsGeneralView, {
        selectedMenuAnchor: selectedItem.anchor
    });
};
