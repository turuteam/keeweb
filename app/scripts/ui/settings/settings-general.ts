import { FunctionComponent, h } from 'preact';
import { SettingsGeneralView } from 'views/settings/settings-general-view';
import { useModelWatcher } from 'util/ui/hooks';
import { AppSettings } from 'models/app-settings';

export const SettingsGeneral: FunctionComponent = () => {
    useModelWatcher(AppSettings);

    return h(SettingsGeneralView, null);
};
