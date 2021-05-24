import { expect } from 'chai';
import { AppSettings, AppSettingsFieldName } from 'models/app-settings';

describe('AppSettings', () => {
    afterEach(() => {
        AppSettings.reset();
    });

    it('does not set an unknown setting', () => {
        expect(AppSettings.set('unknown' as AppSettingsFieldName, 'x')).eql(false);
        expect(AppSettings.toJSON()).to.eql({});
    });

    it('sets a known setting', () => {
        expect(AppSettings.set('theme', 'x')).to.eql(true);
        expect(AppSettings.theme).to.eql('x');
        expect(AppSettings.toJSON()).to.eql({ theme: 'x' });
    });

    it('resets all settings', () => {
        expect(AppSettings.set('locale', 'x')).to.eql(true);
        expect(AppSettings.locale).to.eql('x');
        expect(AppSettings.toJSON()).to.eql({ locale: 'x' });

        AppSettings.reset();
        expect(AppSettings.locale).to.eql(null);
        expect(AppSettings.toJSON()).to.eql({});
    });

    it('deletes a setting', () => {
        AppSettings.theme = 'x';
        AppSettings.rememberKeyFiles = 'data';

        expect(AppSettings.theme).to.eql('x');
        expect(AppSettings.rememberKeyFiles).to.eql('data');
        expect(AppSettings.toJSON()).to.eql({ theme: 'x', rememberKeyFiles: 'data' });

        AppSettings.delete('theme');
        AppSettings.delete('rememberKeyFiles');
        AppSettings.delete('unknown' as AppSettingsFieldName);

        expect(AppSettings.theme).to.eql(null);
        expect(AppSettings.rememberKeyFiles).to.eql('path');
        expect(AppSettings.toJSON()).to.eql({});
    });

    it('sets all settings', () => {
        const allSettings: Record<AppSettingsFieldName, unknown> = {
            theme: 'th',
            autoSwitchTheme: true,
            locale: 'loc',
            expandGroups: false,
            listViewWidth: 1,
            menuViewWidth: 2,
            tagsViewHeight: 3,
            autoUpdate: 'check',
            clipboardSeconds: 4,
            autoSave: false,
            autoSaveInterval: 5,
            rememberKeyFiles: 'data',
            idleMinutes: 6,
            minimizeOnClose: true,
            minimizeOnFieldCopy: true,
            tableView: true,
            colorfulIcons: true,
            useMarkdown: false,
            directAutotype: false,
            autoTypeTitleFilterEnabled: false,
            titlebarStyle: 'hidden-inset',
            lockOnMinimize: false,
            lockOnCopy: true,
            lockOnAutoType: true,
            lockOnOsLock: true,
            helpTipCopyShown: true,
            templateHelpShown: true,
            skipOpenLocalWarn: true,
            hideEmptyFields: true,
            skipHttpsWarning: true,
            demoOpened: true,
            fontSize: 1,
            tableViewColumns: ['x', 'y', 'z'],
            generatorPresets: {
                default: 'xxx',
                disabled: { 'dis': true },
                user: [
                    {
                        name: 'user-name',
                        title: 'user-title',
                        length: 1,
                        pattern: 'pat',
                        include: 'xyz',
                        upper: true,
                        lower: false,
                        digits: true,
                        special: false,
                        brackets: true,
                        high: false,
                        ambiguous: true
                    }
                ]
            },
            generatorHidePassword: true,
            cacheConfigSettings: true,
            allowIframes: true,
            useGroupIconForEntries: true,
            enableUsb: false,
            fieldLabelDblClickAutoType: true,
            auditPasswords: false,
            auditPasswordEntropy: false,
            excludePinsFromAudit: false,
            checkPasswordsOnHIBP: true,
            auditPasswordAge: 7,
            deviceOwnerAuth: 'memory',
            deviceOwnerAuthTimeoutMinutes: 8,
            disableOfflineStorage: true,
            shortLivedStorageToken: true,
            extensionFocusIfLocked: false,
            extensionFocusIfEmpty: false,
            yubiKeyShowIcon: false,
            yubiKeyAutoOpen: true,
            yubiKeyMatchEntries: false,
            yubiKeyShowChalResp: false,
            yubiKeyRememberChalResp: true,
            yubiKeyStuckWorkaround: true,
            canOpen: false,
            canOpenDemo: false,
            canOpenSettings: false,
            canCreate: false,
            canImportXml: false,
            canImportCsv: false,
            canRemoveLatest: false,
            canExportXml: false,
            canExportHtml: false,
            canSaveTo: false,
            canOpenStorage: false,
            canOpenGenerator: false,
            canOpenOtpDevice: false,
            globalShortcutCopyPassword: 'cp',
            globalShortcutCopyUser: 'cu',
            globalShortcutCopyUrl: 'cr',
            globalShortcutCopyOtp: 'co',
            globalShortcutAutoType: 'ca',
            globalShortcutRestoreApp: 'ra',
            dropbox: false,
            dropboxFolder: 'df',
            dropboxAppKey: 'dk',
            dropboxSecret: 'ds',
            webdav: false,
            webdavSaveMethod: 'put',
            webdavStatReload: true,
            gdrive: false,
            gdriveClientId: 'gc',
            gdriveClientSecret: 'gs',
            onedrive: false,
            onedriveClientId: 'oc',
            onedriveClientSecret: 'os'
        };

        for (const [key, value] of Object.entries(allSettings)) {
            AppSettings.set(key as AppSettingsFieldName, value);
        }
        expect(AppSettings.toJSON()).to.eql(allSettings);
    });

    it('loads settings and saves them on change', async () => {
        localStorage.setItem('appSettings', '{ "theme": "x" }');

        expect(AppSettings.theme).to.eql(null);

        await AppSettings.init();

        expect(AppSettings.theme).to.eql('x');
        expect(localStorage.getItem('appSettings')).to.eql('{ "theme": "x" }');

        AppSettings.theme = 'x';
        expect(localStorage.getItem('appSettings')).to.eql('{ "theme": "x" }');

        AppSettings.theme = 'y';
        expect(localStorage.getItem('appSettings')).to.eql('{"theme":"y"}');

        AppSettings.disableSaveOnChange();

        AppSettings.theme = 'z';
        expect(localStorage.getItem('appSettings')).to.eql('{"theme":"y"}');
    });
});
