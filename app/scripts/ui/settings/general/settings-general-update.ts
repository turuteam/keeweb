import { FunctionComponent, h } from 'preact';
import { SettingsGeneralUpdateView } from 'views/settings/general/settings-general-update-view';
import { Updater } from 'comp/app/updater';
import { Launcher } from 'comp/launcher';
import { AppSettings, AppSettingsAutoUpdate } from 'models/app-settings';
import { useModelWatcher } from 'util/ui/hooks';
import { Locale } from 'util/locale';
import { SemVer } from 'util/data/semver';
import { RuntimeInfo } from 'const/runtime-info';
import { DateFormat } from 'util/formatting/date-format';
import { RuntimeData } from 'models/runtime-data';
import { noop } from 'util/fn';

export const SettingsGeneralUpdate: FunctionComponent = () => {
    useModelWatcher(Updater);
    useModelWatcher(RuntimeData);

    const getUpdateInfo = () => {
        switch (Updater.status) {
            case 'checking':
                return Locale.setGenUpdateChecking + '...';
            case 'error': {
                let errMsg = Locale.setGenErrorChecking;
                if (Updater.updateError) {
                    errMsg += ': ' + Updater.updateError;
                }
                if (RuntimeData.lastSuccessUpdateCheckDate && RuntimeData.lastUpdateVersion) {
                    errMsg +=
                        '. ' +
                        Locale.setGenLastCheckSuccess.with(
                            DateFormat.dtStr(RuntimeData.lastSuccessUpdateCheckDate)
                        ) +
                        ': ' +
                        Locale.setGenLastCheckVer.with(RuntimeData.lastUpdateVersion);
                }
                return errMsg;
            }
            case 'ok': {
                if (!RuntimeData.lastUpdateVersion) {
                    return Locale.setGenErrorChecking + ': no version';
                }
                let msg =
                    Locale.setGenCheckedAt +
                    ' ' +
                    (RuntimeData.lastUpdateCheckDate
                        ? DateFormat.dtStr(RuntimeData.lastUpdateCheckDate)
                        : '') +
                    ': ';
                const cmp = SemVer.compareVersions(
                    RuntimeInfo.version,
                    RuntimeData.lastUpdateVersion
                );
                if (cmp >= 0) {
                    msg += Locale.setGenLatestVer;
                } else {
                    msg +=
                        Locale.setGenNewVer.with(RuntimeData.lastUpdateVersion) +
                        ' ' +
                        (RuntimeData.lastUpdateVersionReleaseDate
                            ? DateFormat.dStr(RuntimeData.lastUpdateVersionReleaseDate)
                            : '');
                }
                switch (Updater.updateStatus) {
                    case 'downloading':
                        return msg + '. ' + Locale.setGenDownloadingUpdate;
                    case 'extracting':
                        return msg + '. ' + Locale.setGenExtractingUpdate;
                    case 'error':
                        return msg + '. ' + Locale.setGenCheckErr;
                }
                return msg;
            }
            default:
                return Locale.setGenNeverChecked;
        }
    };

    const installUpdateClicked = () => {
        if (Launcher) {
            Updater.installAndRestart().catch(noop);
        } else {
            window.location.reload();
        }
    };

    const checkUpdateClicked = () => {
        Updater.check(true).catch(noop);
    };

    const downloadAndInstallUpdateClicked = () => {
        Updater.updateAndRestart().catch(noop);
    };

    const autoUpdateChanged = (autoUpdate: AppSettingsAutoUpdate | null) => {
        AppSettings.autoUpdate = autoUpdate;
        if (autoUpdate) {
            Updater.scheduleNextCheck();
        }
    };

    return h(SettingsGeneralUpdateView, {
        updateWaitingReload: Updater.updateStatus === 'ready' && !Launcher,
        autoUpdate: AppSettings.autoUpdate,
        showUpdateBlock: Updater.enabled,
        updateInfo: getUpdateInfo(),
        updateInProgress: Updater.updateInProgress,
        updateReady: Updater.updateStatus === 'ready',
        updateFound: Updater.updateStatus === 'found',

        installUpdateClicked,
        checkUpdateClicked,
        downloadAndInstallUpdateClicked,
        autoUpdateChanged
    });
};
