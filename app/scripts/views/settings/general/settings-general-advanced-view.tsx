import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { SettingsGeneralAppLogs } from 'ui/settings/general/settings-general-app-logs';

export const SettingsGeneralAdvancedView: FunctionComponent<{
    showAdvanced: boolean;
    devTools: boolean;
    showReloadApp: boolean;
    showAppLogs: boolean;

    showAdvancedChanged: () => void;
    reloadAppClicked: () => void;
    showDevToolsClicked: () => void;
    tryBetaClicked: () => void;
    showAppLogsClicked: () => void;
}> = ({
    showAdvanced,
    devTools,
    showReloadApp,
    showAppLogs,

    showAdvancedChanged,
    reloadAppClicked,
    showDevToolsClicked,
    tryBetaClicked,
    showAppLogsClicked
}) => {
    return (
        <>
            <h2 id="advanced">{Locale.advanced}</h2>
            <p>
                <a class="settings__general-show-advanced" onClick={showAdvancedChanged}>
                    {Locale.setGenShowAdvanced}
                </a>
            </p>
            {showAdvanced ? (
                <div class="settings__general-advanced">
                    {devTools ? (
                        <>
                            <button
                                class="btn-silent settings__general-dev-tools-link"
                                onClick={showDevToolsClicked}
                            >
                                {Locale.setGenDevTools}
                            </button>
                            <button
                                class="btn-silent settings__general-try-beta-link"
                                onClick={tryBetaClicked}
                            >
                                {Locale.setGenTryBeta}
                            </button>
                        </>
                    ) : null}
                    {showReloadApp ? (
                        <button
                            class="btn-silent settings__general-reload-app-link"
                            onClick={reloadAppClicked}
                        >
                            {Locale.setGenReloadApp}
                        </button>
                    ) : null}
                    <button
                        class="btn-silent settings__general-show-logs-link"
                        onClick={showAppLogsClicked}
                    >
                        {Locale.setGenShowAppLogs}
                    </button>
                    {showAppLogs ? <SettingsGeneralAppLogs /> : null}
                </div>
            ) : null}
        </>
    );
};
