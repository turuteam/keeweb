import { FunctionComponent, h } from 'preact';
import { SettingsGeneralLockView } from 'views/settings/general/settings-general-lock-view';
import { AppSettings } from 'models/app-settings';
import { Launcher } from 'comp/launcher';

export const SettingsGeneralLock: FunctionComponent = () => {
    return h(SettingsGeneralLockView, {
        idleMinutes: AppSettings.idleMinutes,
        canDetectMinimize: !!Launcher,
        lockOnMinimize: AppSettings.lockOnMinimize,
        lockOnCopy: AppSettings.lockOnCopy,
        canAutoType: !!Launcher,
        lockOnAutoType: AppSettings.lockOnAutoType,
        canDetectOsSleep: !!Launcher,
        lockOnOsLock: AppSettings.lockOnOsLock
    });
};
