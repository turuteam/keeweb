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
}> = ({
    updateWaitingReload,
    autoUpdate,
    showUpdateBlock,
    updateInfo,
    updateInProgress,
    updateReady,
    updateFound
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
                        <button class="settings__general-restart-btn">
                            {Locale.setGenReloadToUpdate}
                        </button>
                    </div>
                </>
            ) : null}
            {showUpdateBlock ? (
                <>
                    <h2>{Locale.setGenUpdate}</h2>
                    <div>
                        <select class="settings__general-auto-update settings__select input-base">
                            <option value="install" selected={autoUpdate === 'install'}>
                                {Locale.setGenUpdateAuto}
                            </option>
                            <option value="check" selected={autoUpdate === 'check'}>
                                {Locale.setGenUpdateCheck}
                            </option>
                            <option value="" selected={!autoUpdate}>
                                {Locale.setGenNoUpdate}
                            </option>
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
                            <button class="settings__general-update-btn btn-silent">
                                {Locale.setGenCheckUpdate}
                            </button>
                        )}
                        {updateReady ? (
                            <button class="settings__general-restart-btn">
                                {Locale.setGenRestartToUpdate}
                            </button>
                        ) : null}
                        {updateFound ? (
                            <button class="settings__general-update-found-btn">
                                {Locale.setGenDownloadAndRestart}
                            </button>
                        ) : null}
                    </div>
                </>
            ) : null}
        </>
    );
};
