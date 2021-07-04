import { Events } from 'framework/events';
import { View } from 'framework/views/view';
import { Storage } from 'storage';
import { Updater } from 'comp/app/updater';
import { Launcher } from 'comp/launcher';
import { Links } from 'const/links';
import { AppSettingsModel } from 'models/app-settings-model';
import { minmax } from 'util/fn';
import { NativeModules } from 'comp/launcher/native-modules';

class SettingsGeneralView extends View {
    changeClipboard(e) {
        const clipboardSeconds = +e.target.value;
        AppSettingsModel.clipboardSeconds = clipboardSeconds;
    }

    changeIdleMinutes(e) {
        const idleMinutes = +e.target.value;
        AppSettingsModel.idleMinutes = idleMinutes;
    }

    changeAutoUpdate(e) {
        const autoUpdate = e.target.value || false;
        AppSettingsModel.autoUpdate = autoUpdate;
        if (autoUpdate) {
            Updater.scheduleNextCheck();
        }
    }

    checkUpdate() {
        Updater.check(true);
    }

    changeAutoSave(e) {
        const autoSave = e.target.checked || false;
        AppSettingsModel.autoSave = autoSave;
    }

    changeAutoSaveInterval(e) {
        const autoSaveInterval = e.target.value | 0;
        AppSettingsModel.autoSaveInterval = autoSaveInterval;
    }

    changeRememberKeyFiles(e) {
        const rememberKeyFiles = e.target.value || false;
        AppSettingsModel.rememberKeyFiles = rememberKeyFiles;
        this.appModel.clearStoredKeyFiles();
    }

    changeMinimize(e) {
        const minimizeOnClose = e.target.checked || false;
        AppSettingsModel.minimizeOnClose = minimizeOnClose;
    }

    changeMinimizeOnFieldCopy(e) {
        const minimizeOnFieldCopy = e.target.checked || false;
        AppSettingsModel.minimizeOnFieldCopy = minimizeOnFieldCopy;
    }

    changeAuditPasswords(e) {
        const auditPasswords = e.target.checked || false;
        AppSettingsModel.auditPasswords = auditPasswords;
    }

    changeAuditPasswordEntropy(e) {
        const auditPasswordEntropy = e.target.checked || false;
        AppSettingsModel.auditPasswordEntropy = auditPasswordEntropy;
    }

    changeExcludePinsFromAudit(e) {
        const excludePinsFromAudit = e.target.checked || false;
        AppSettingsModel.excludePinsFromAudit = excludePinsFromAudit;
    }

    changeCheckPasswordsOnHIBP(e) {
        if (e.target.closest('a')) {
            return;
        }
        const checkPasswordsOnHIBP = e.target.checked || false;
        AppSettingsModel.checkPasswordsOnHIBP = checkPasswordsOnHIBP;
    }

    clickToggleHelpHIBP() {
        this.el.querySelector('.settings__general-help-hibp').classList.toggle('hide');
    }

    changeAuditPasswordAge(e) {
        const auditPasswordAge = e.target.value | 0;
        AppSettingsModel.auditPasswordAge = auditPasswordAge;
    }

    changeLockOnMinimize(e) {
        const lockOnMinimize = e.target.checked || false;
        AppSettingsModel.lockOnMinimize = lockOnMinimize;
    }

    changeLockOnCopy(e) {
        const lockOnCopy = e.target.checked || false;
        AppSettingsModel.lockOnCopy = lockOnCopy;
    }

    changeLockOnAutoType(e) {
        const lockOnAutoType = e.target.checked || false;
        AppSettingsModel.lockOnAutoType = lockOnAutoType;
    }

    changeLockOnOsLock(e) {
        const lockOnOsLock = e.target.checked || false;
        AppSettingsModel.lockOnOsLock = lockOnOsLock;
    }

    changeUseMarkdown(e) {
        const useMarkdown = e.target.checked || false;
        AppSettingsModel.useMarkdown = useMarkdown;
        Events.emit('refresh');
    }

    changeUseGroupIconForEntries(e) {
        const useGroupIconForEntries = e.target.checked || false;
        AppSettingsModel.useGroupIconForEntries = useGroupIconForEntries;
    }

    changeDirectAutotype(e) {
        const directAutotype = e.target.checked || false;
        AppSettingsModel.directAutotype = directAutotype;
    }

    changeAutoTypeTitleFilter(e) {
        const autoTypeTitleFilterEnabled = e.target.checked || false;
        AppSettingsModel.autoTypeTitleFilterEnabled = autoTypeTitleFilterEnabled;
    }

    changeFieldLabelDblClickAutoType(e) {
        const fieldLabelDblClickAutoType = e.target.checked || false;
        AppSettingsModel.fieldLabelDblClickAutoType = fieldLabelDblClickAutoType;
        Events.emit('refresh');
    }

    changeDeviceOwnerAuth(e) {
        const deviceOwnerAuth = e.target.value || null;

        let deviceOwnerAuthTimeoutMinutes = AppSettingsModel.deviceOwnerAuthTimeoutMinutes | 0;
        if (deviceOwnerAuth) {
            const timeouts = { memory: [30, 10080], file: [30, 525600] };
            const [tMin, tMax] = timeouts[deviceOwnerAuth] || [0, 0];
            deviceOwnerAuthTimeoutMinutes = minmax(deviceOwnerAuthTimeoutMinutes, tMin, tMax);
        }

        AppSettingsModel.set({ deviceOwnerAuth, deviceOwnerAuthTimeoutMinutes });
        this.render();

        this.appModel.checkEncryptedPasswordsStorage();
        if (!deviceOwnerAuth) {
            NativeModules.hardwareCryptoDeleteKey().catch(() => {});
        }
    }

    changeDeviceOwnerAuthTimeout(e) {
        const deviceOwnerAuthTimeout = e.target.value | 0;
        AppSettingsModel.deviceOwnerAuthTimeoutMinutes = deviceOwnerAuthTimeout;
    }

    installUpdateAndRestart() {
        if (Launcher) {
            Updater.installAndRestart();
        } else {
            window.location.reload();
        }
    }

    downloadUpdate() {
        Launcher.openLink(Links.Desktop);
    }

    installFoundUpdate() {
        Updater.update(true, () => {
            Updater.installAndRestart();
        });
    }

    changeDisableOfflineStorage(e) {
        const disableOfflineStorage = e.target.checked;
        AppSettingsModel.disableOfflineStorage = disableOfflineStorage;
        if (disableOfflineStorage) {
            this.appModel.deleteAllCachedFiles();
        }
    }

    changeShortLivedStorageToken(e) {
        const shortLivedStorageToken = e.target.checked;
        AppSettingsModel.shortLivedStorageToken = shortLivedStorageToken;
        if (shortLivedStorageToken) {
            for (const storage of Object.values(Storage)) {
                storage.deleteStoredToken();
            }
        }
    }

    changeStorageEnabled(e) {
        const storage = Storage[$(e.target).data('storage')];
        if (storage) {
            storage.setEnabled(e.target.checked);
            AppSettingsModel[storage.name] = storage.enabled;
            this.$el
                .find('.settings__general-' + storage.name)
                .toggleClass('hide', !e.target.checked);
        }
    }

    logoutFromStorage(e) {
        const storage = Storage[$(e.target).data('storage')];
        if (storage) {
            storage.logout();
            $(e.target).remove();
        }
    }
}

export { SettingsGeneralView };
