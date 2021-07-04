import { FunctionComponent, h } from 'preact';
import { SettingsGeneralLockView } from 'views/settings/general/settings-general-lock-view';
import { AppSettings } from 'models/app-settings';
import { Launcher } from 'comp/launcher';

export const SettingsGeneralLock: FunctionComponent = () => {
    const idleMinutesChanged = (idleMinutes: number) => {
        AppSettings.idleMinutes = idleMinutes;
    };

    const lockOnMinimizeChanged = () => {
        AppSettings.lockOnMinimize = !AppSettings.lockOnMinimize;
    };

    const lockOnCopyChanged = () => {
        AppSettings.lockOnCopy = !AppSettings.lockOnCopy;
    };

    const lockOnAutoTypeChanged = () => {
        AppSettings.lockOnAutoType = !AppSettings.lockOnAutoType;
    };

    const lockOnOsLockChanged = () => {
        AppSettings.lockOnOsLock = !AppSettings.lockOnOsLock;
    };

    return h(SettingsGeneralLockView, {
        idleMinutes: AppSettings.idleMinutes,
        canDetectMinimize: !!Launcher,
        lockOnMinimize: AppSettings.lockOnMinimize,
        lockOnCopy: AppSettings.lockOnCopy,
        canAutoType: !!Launcher,
        lockOnAutoType: AppSettings.lockOnAutoType,
        canDetectOsSleep: !!Launcher,
        lockOnOsLock: AppSettings.lockOnOsLock,

        idleMinutesChanged,
        lockOnMinimizeChanged,
        lockOnCopyChanged,
        lockOnAutoTypeChanged,
        lockOnOsLockChanged
    });
};
