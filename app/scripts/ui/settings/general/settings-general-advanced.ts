import { FunctionComponent, h } from 'preact';
import { SettingsGeneralAdvancedView } from 'views/settings/general/settings-general-advanced-view';
import { Launcher } from 'comp/launcher';
import { Features } from 'util/features';
import { useState } from 'preact/hooks';
import { Alerts } from 'comp/ui/alerts';
import { Locale } from 'util/locale';
import { Links } from 'const/links';
import { FileManager } from 'models/file-manager';

export const SettingsGeneralAdvanced: FunctionComponent = () => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showAppLogs, setShowAppLogs] = useState(false);

    const showAdvancedChanged = () => {
        setShowAdvanced(!showAdvanced);
    };

    const reloadAppClicked = () => {
        location.reload();
    };

    const showDevToolsClicked = () => {
        Launcher?.ipcRenderer.invoke('show-devtools');
    };

    const tryBetaClicked = () => {
        if (FileManager.hasUnsavedFiles) {
            Alerts.info({
                header: Locale.setGenTryBetaWarning,
                body: Locale.setGenTryBetaWarningBody
            });
        } else {
            location.href = Links.BetaWebApp;
        }
    };

    const showAppLogsClicked = () => {
        setShowAppLogs(!showAppLogs);
    };

    return h(SettingsGeneralAdvancedView, {
        showAdvanced,
        showAppLogs,
        devTools: !!Launcher,
        showReloadApp: Features.isStandalone,

        showAdvancedChanged,
        reloadAppClicked,
        showDevToolsClicked,
        tryBetaClicked,
        showAppLogsClicked
    });
};
