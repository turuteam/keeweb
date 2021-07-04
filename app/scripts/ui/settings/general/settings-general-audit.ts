import { FunctionComponent, h } from 'preact';
import { SettingsGeneralAuditView } from 'views/settings/general/settings-general-audit-view';
import { AppSettings } from 'models/app-settings';

export const SettingsGeneralAudit: FunctionComponent = () => {
    return h(SettingsGeneralAuditView, {
        auditPasswords: AppSettings.auditPasswords,
        auditPasswordEntropy: AppSettings.auditPasswordEntropy,
        excludePinsFromAudit: AppSettings.excludePinsFromAudit,
        checkPasswordsOnHIBP: AppSettings.checkPasswordsOnHIBP,
        auditPasswordAge: AppSettings.auditPasswordAge
    });
};
