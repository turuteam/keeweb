import { FunctionComponent, h } from 'preact';
import { SettingsGeneralAdvancedView } from 'views/settings/general/settings-general-advanced-view';
import { Launcher } from 'comp/launcher';
import { Features } from 'util/features';

export const SettingsGeneralAdvanced: FunctionComponent = () => {
    return h(SettingsGeneralAdvancedView, {
        devTools: !!Launcher,
        showReloadApp: Features.isStandalone
    });
};
