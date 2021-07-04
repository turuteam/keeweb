import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { AppSettingsAutoUpdate } from 'models/app-settings';
import { Links } from 'const/links';

export const SettingsGeneralUpdateView: FunctionComponent<{
    updateWaitingReload: boolean;
    autoUpdate: AppSettingsAutoUpdate | null;
    showUpdateBlock: boolean;
    updateInfo: string;
    updateInProgress: boolean;
    updateReady: boolean;
    updateFound: boolean;

    installUpdateClicked: () => void;
    checkUpdateClicked: () => void;
    downloadAndInstallUpdateClicked: () => void;
    autoUpdateChanged: (autoUpdate: AppSettingsAutoUpdate | null) => void;
}> = ({
    updateWaitingReload,
    autoUpdate,
    showUpdateBlock,
    updateInfo,
    updateInProgress,
    updateReady,
    updateFound,

    installUpdateClicked,
    checkUpdateClicked,
    downloadAndInstallUpdateClicked,
    autoUpdateChanged
}) => {
    return (
        <>
            {updateWaitingReload ? (
                <>
                    <h2 class="action-color">{Locale.setGenUpdate}</h2>
                    <div>
                        {Locale.setGenNewVersion}.{' '}
                        <a href={Links.ReleaseNotes} target="_blank" rel="noreferrer">
                            {Locale.setGenReleaseNotes}
                        </a>
                    </div>
                    <div class="settings__general-update-buttons">
                        <button
                            class="settings__general-restart-btn"
                            onClick={installUpdateClicked}
                        >
                            {Locale.setGenReloadToUpdate}
                        </button>
                    </div>
                </>
            ) : null}
            {showUpdateBlock ? (
                <>
                    <h2>{Locale.setGenUpdate}</h2>
                    <div>
                        <select
                            class="settings__general-auto-update settings__select input-base"
                            value={autoUpdate || ''}
                            onChange={(e) => {
                                const val = (e.target as HTMLSelectElement).value || null;
                                autoUpdateChanged(val as AppSettingsAutoUpdate | null);
                            }}
                        >
                            <option value="install">{Locale.setGenUpdateAuto}</option>
                            <option value="check">{Locale.setGenUpdateCheck}</option>
                            <option value="">{Locale.setGenNoUpdate}</option>
                        </select>
                        <div>{updateInfo}</div>
                        <a href={Links.ReleaseNotes} target="_blank" rel="noreferrer">
                            {Locale.setGenReleaseNotes}
                        </a>
                    </div>
                    <div class="settings__general-update-buttons">
                        {updateInProgress ? (
                            <button class="settings__general-update-btn btn-silent" disabled>
                                {Locale.setGenUpdateChecking}
                            </button>
                        ) : (
                            <button
                                class="settings__general-update-btn btn-silent"
                                onClick={checkUpdateClicked}
                            >
                                {Locale.setGenCheckUpdate}
                            </button>
                        )}
                        {updateReady ? (
                            <button
                                class="settings__general-restart-btn"
                                onClick={installUpdateClicked}
                            >
                                {Locale.setGenRestartToUpdate}
                            </button>
                        ) : null}
                        {updateFound ? (
                            <button
                                class="settings__general-update-found-btn"
                                onClick={downloadAndInstallUpdateClicked}
                            >
                                {Locale.setGenDownloadAndRestart}
                            </button>
                        ) : null}
                    </div>
                </>
            ) : null}
        </>
    );
};
