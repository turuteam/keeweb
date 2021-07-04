import { FunctionComponent, h } from 'preact';
import { SettingsGeneralAuditView } from 'views/settings/general/settings-general-audit-view';
import { AppSettings } from 'models/app-settings';
import { useState } from 'preact/hooks';

export const SettingsGeneralAudit: FunctionComponent = () => {
    const [showAboutHIBP, setShowAboutHIBP] = useState(false);

    const auditPasswordsChanged = () => {
        AppSettings.auditPasswords = !AppSettings.auditPasswords;
    };

    const auditPasswordEntropyChanged = () => {
        AppSettings.auditPasswordEntropy = !AppSettings.auditPasswordEntropy;
    };

    const excludePinsFromAuditChanged = () => {
        AppSettings.excludePinsFromAudit = !AppSettings.excludePinsFromAudit;
    };

    const checkPasswordsOnHIBPChanged = () => {
        AppSettings.checkPasswordsOnHIBP = !AppSettings.checkPasswordsOnHIBP;
    };

    const showAboutHIBPChanged = () => {
        setShowAboutHIBP(!showAboutHIBP);
    };

    const auditPasswordAgeChanged = (age: number) => {
        AppSettings.auditPasswordAge = age;
    };

    return h(SettingsGeneralAuditView, {
        auditPasswords: AppSettings.auditPasswords,
        auditPasswordEntropy: AppSettings.auditPasswordEntropy,
        excludePinsFromAudit: AppSettings.excludePinsFromAudit,
        checkPasswordsOnHIBP: AppSettings.checkPasswordsOnHIBP,
        showAboutHIBP,
        auditPasswordAge: AppSettings.auditPasswordAge,

        auditPasswordsChanged,
        auditPasswordEntropyChanged,
        excludePinsFromAuditChanged,
        checkPasswordsOnHIBPChanged,
        showAboutHIBPChanged,
        auditPasswordAgeChanged
    });
};
