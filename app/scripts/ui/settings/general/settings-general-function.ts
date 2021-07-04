import { FunctionComponent, h } from 'preact';
import { SettingsGeneralFunctionView } from 'views/settings/general/settings-general-function-view';
import { Launcher } from 'comp/launcher';
import { AppSettings } from 'models/app-settings';
import { Features } from 'util/features';

export const SettingsGeneralFunction: FunctionComponent = () => {
    return h(SettingsGeneralFunctionView, {
        canAutoSaveOnClose: !!Launcher,
        autoSave: AppSettings.autoSave,
        autoSaveInterval: AppSettings.autoSaveInterval,
        rememberKeyFiles: AppSettings.rememberKeyFiles,
        supportFiles: !!Launcher,
        canClearClipboard: !!Launcher,
        clipboardSeconds: AppSettings.clipboardSeconds,
        canMinimize: !!Launcher,
        minimizeOnClose: AppSettings.minimizeOnClose,
        minimizeOnFieldCopy: AppSettings.minimizeOnFieldCopy,
        canAutoType: !!Launcher,
        directAutotype: AppSettings.directAutotype,
        autoTypeTitleFilterEnabled: AppSettings.autoTypeTitleFilterEnabled,
        fieldLabelDblClickAutoType: AppSettings.fieldLabelDblClickAutoType,
        useMarkdown: AppSettings.useMarkdown,
        useGroupIconForEntries: AppSettings.useGroupIconForEntries,
        hasDeviceOwnerAuth: Features.isDesktop && Features.isMac,
        deviceOwnerAuth: AppSettings.deviceOwnerAuth,
        deviceOwnerAuthTimeout: AppSettings.deviceOwnerAuthTimeoutMinutes
    });
};
