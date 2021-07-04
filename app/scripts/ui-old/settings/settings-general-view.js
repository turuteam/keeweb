import { Events } from 'framework/events';
import { View } from 'framework/views/view';
import { Storage } from 'storage';
import { Updater } from 'comp/app/updater';
import { Launcher } from 'comp/launcher';
import { Alerts } from 'comp/ui/alerts';
import { Links } from 'const/links';
import { AppSettingsModel } from 'models/app-settings-model';
import { Locale } from 'util/locale';
import { SettingsLogsView } from 'views/settings/settings-logs-view';
import { minmax } from 'util/fn';
import { NativeModules } from 'comp/launcher/native-modules';
import template from 'templates/settings/settings-general.hbs';

class SettingsGeneralView extends View {
    template = template;

    events = {
        'click .settings__general-theme': 'changeTheme',
        'click .settings__general-auto-switch-theme': 'changeAuthSwitchTheme',
        'change .settings__general-locale': 'changeLocale',
        'change .settings__general-font-size': 'changeFontSize',
        'change .settings__general-expand': 'changeExpandGroups',
        'change .settings__general-auto-update': 'changeAutoUpdate',
        'change .settings__general-idle-minutes': 'changeIdleMinutes',
        'change .settings__general-clipboard': 'changeClipboard',
        'change .settings__general-auto-save': 'changeAutoSave',
        'change .settings__general-auto-save-interval': 'changeAutoSaveInterval',
        'change .settings__general-remember-key-files': 'changeRememberKeyFiles',
        'change .settings__general-minimize': 'changeMinimize',
        'change .settings__general-minimize-on-field-copy': 'changeMinimizeOnFieldCopy',
        'change .settings__general-audit-passwords': 'changeAuditPasswords',
        'change .settings__general-audit-password-entropy': 'changeAuditPasswordEntropy',
        'change .settings__general-exclude-pins-from-audit': 'changeExcludePinsFromAudit',
        'change .settings__general-check-passwords-on-hibp': 'changeCheckPasswordsOnHIBP',
        'click .settings__general-toggle-help-hibp': 'clickToggleHelpHIBP',
        'change .settings__general-audit-password-age': 'changeAuditPasswordAge',
        'change .settings__general-lock-on-minimize': 'changeLockOnMinimize',
        'change .settings__general-lock-on-copy': 'changeLockOnCopy',
        'change .settings__general-lock-on-auto-type': 'changeLockOnAutoType',
        'change .settings__general-lock-on-os-lock': 'changeLockOnOsLock',
        'change .settings__general-table-view': 'changeTableView',
        'change .settings__general-colorful-icons': 'changeColorfulIcons',
        'change .settings__general-use-markdown': 'changeUseMarkdown',
        'change .settings__general-use-group-icon-for-entries': 'changeUseGroupIconForEntries',
        'change .settings__general-direct-autotype': 'changeDirectAutotype',
        'change .settings__general-autotype-title-filter': 'changeAutoTypeTitleFilter',
        'change .settings__general-field-label-dblclick-autotype':
            'changeFieldLabelDblClickAutoType',
        'change .settings__general-device-owner-auth': 'changeDeviceOwnerAuth',
        'change .settings__general-device-owner-auth-timeout': 'changeDeviceOwnerAuthTimeout',
        'change .settings__general-titlebar-style': 'changeTitlebarStyle',
        'click .settings__general-update-btn': 'checkUpdate',
        'click .settings__general-restart-btn': 'installUpdateAndRestart',
        'click .settings__general-download-update-btn': 'downloadUpdate',
        'click .settings__general-update-found-btn': 'installFoundUpdate',
        'change .settings__general-disable-offline-storage': 'changeDisableOfflineStorage',
        'change .settings__general-short-lived-storage-token': 'changeShortLivedStorageToken',
        'change .settings__general-prv-check': 'changeStorageEnabled',
        'click .settings__general-prv-logout': 'logoutFromStorage',
        'click .settings__general-show-advanced': 'showAdvancedSettings',
        'click .settings__general-dev-tools-link': 'openDevTools',
        'click .settings__general-try-beta-link': 'tryBeta',
        'click .settings__general-show-logs-link': 'showLogs',
        'click .settings__general-reload-app-link': 'reloadApp'
    };

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

    showAdvancedSettings() {
        this.$el
            .find('.settings__general-show-advanced, .settings__general-advanced')
            .toggleClass('hide');
        this.scrollToBottom();
    }

    openDevTools() {
        if (Launcher) {
            Launcher.openDevTools();
        }
    }

    tryBeta() {
        if (this.appModel.files.hasUnsavedFiles()) {
            Alerts.info({
                header: Locale.setGenTryBetaWarning,
                body: Locale.setGenTryBetaWarningBody
            });
        } else {
            location.href = Links.BetaWebApp;
        }
    }

    showLogs() {
        if (this.views.logView) {
            this.views.logView.remove();
        }
        this.views.logView = new SettingsLogsView();
        this.views.logView.render();
        this.scrollToBottom();
    }

    reloadApp() {
        location.reload();
    }

    scrollToBottom() {
        this.$el.closest('.scroller').scrollTop(this.$el.height());
    }
}

export { SettingsGeneralView };
