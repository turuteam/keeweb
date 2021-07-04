import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';

export const SettingsGeneralAdvancedView: FunctionComponent<{
    devTools: boolean;
    showReloadApp: boolean;
}> = ({ devTools, showReloadApp }) => {
    return (
        <>
            <h2 id="advanced">{Locale.advanced}</h2>
            <a class="settings__general-show-advanced">{Locale.setGenShowAdvanced}</a>
            <div class="settings__general-advanced hide">
                {devTools ? (
                    <>
                        <button class="btn-silent settings__general-dev-tools-link">
                            {Locale.setGenDevTools}
                        </button>
                        <button class="btn-silent settings__general-try-beta-link">
                            {Locale.setGenTryBeta}
                        </button>
                    </>
                ) : null}
                {showReloadApp ? (
                    <button class="btn-silent settings__general-reload-app-link">
                        {Locale.setGenReloadApp}
                    </button>
                ) : null}
                <button class="btn-silent settings__general-show-logs-link">
                    {Locale.setGenShowAppLogs}
                </button>
            </div>
        </>
    );
};
