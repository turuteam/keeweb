import { FunctionComponent, h } from 'preact';
import { SettingsGeneralFunctionView } from 'views/settings/general/settings-general-function-view';
import { Launcher } from 'comp/launcher';
import {
    AppSettings,
    AppSettingsDeviceOwnerAuth,
    AppSettingsRememberKeyFiles
} from 'models/app-settings';
import { Features } from 'util/features';
import { FileManager } from 'models/file-manager';
import { minmax } from 'util/fn';

export const SettingsGeneralFunction: FunctionComponent = () => {
    const autoSaveChanged = () => {
        AppSettings.autoSave = !AppSettings.autoSave;
    };

    const autoSaveIntervalChanged = (interval: number) => {
        AppSettings.autoSaveInterval = interval;
    };

    const rememberKeyFilesChanged = (rememberKeyFiles: AppSettingsRememberKeyFiles | null) => {
        AppSettings.rememberKeyFiles = rememberKeyFiles;
        FileManager.clearStoredKeyFiles();
    };

    const clipboardSecondsChanged = (seconds: number) => {
        AppSettings.clipboardSeconds = seconds;
    };

    const minimizeOnCloseChanged = () => {
        AppSettings.minimizeOnClose = !AppSettings.minimizeOnClose;
    };

    const minimizeOnFieldCopyChanged = () => {
        AppSettings.minimizeOnFieldCopy = !AppSettings.minimizeOnFieldCopy;
    };

    const directAutoTypeChanged = () => {
        AppSettings.directAutotype = !AppSettings.directAutotype;
    };

    const autoTypeTitleFilterEnabledChanged = () => {
        AppSettings.autoTypeTitleFilterEnabled = !AppSettings.autoTypeTitleFilterEnabled;
    };

    const fieldLabelDblClickAutoTypeChanged = () => {
        AppSettings.fieldLabelDblClickAutoType = !AppSettings.fieldLabelDblClickAutoType;
    };

    const useMarkdownChanged = () => {
        AppSettings.useMarkdown = !AppSettings.useMarkdown;
    };

    const useGroupIconForEntriesChanged = () => {
        AppSettings.useGroupIconForEntries = !AppSettings.useGroupIconForEntries;
    };

    const deviceOwnerAuthChanged = (deviceOwnerAuth: AppSettingsDeviceOwnerAuth | null) => {
        let deviceOwnerAuthTimeoutMinutes = AppSettings.deviceOwnerAuthTimeoutMinutes | 0;
        if (deviceOwnerAuth) {
            const timeouts = { memory: [30, 10080], file: [30, 525600] };
            const [tMin, tMax] = timeouts[deviceOwnerAuth] || [0, 0];
            deviceOwnerAuthTimeoutMinutes = minmax(deviceOwnerAuthTimeoutMinutes, tMin, tMax);
        }

        AppSettings.deviceOwnerAuth = deviceOwnerAuth;
        AppSettings.deviceOwnerAuthTimeoutMinutes = deviceOwnerAuthTimeoutMinutes;

        // TODO: device owner auth
        // Workspace.checkEncryptedPasswordsStorage();
        // if (!deviceOwnerAuth) {
        //     NativeModules.hardwareCryptoDeleteKey().catch(() => {});
        // }
    };

    const deviceOwnerAuthTimeoutChanged = (timeout: number) => {
        AppSettings.deviceOwnerAuthTimeoutMinutes = timeout;
    };

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
        deviceOwnerAuthTimeout: AppSettings.deviceOwnerAuthTimeoutMinutes,

        autoSaveChanged,
        autoSaveIntervalChanged,
        rememberKeyFilesChanged,
        clipboardSecondsChanged,
        minimizeOnCloseChanged,
        minimizeOnFieldCopyChanged,
        directAutoTypeChanged,
        autoTypeTitleFilterEnabledChanged,
        fieldLabelDblClickAutoTypeChanged,
        useMarkdownChanged,
        useGroupIconForEntriesChanged,
        deviceOwnerAuthChanged,
        deviceOwnerAuthTimeoutChanged
    });
};
