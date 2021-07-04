import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { LocalizedWith } from 'views/components/localized-with';
import { Links } from 'const/links';

export const SettingsGeneralAuditView: FunctionComponent<{
    auditPasswords: boolean;
    auditPasswordEntropy: boolean;
    excludePinsFromAudit: boolean;
    checkPasswordsOnHIBP: boolean;
    auditPasswordAge: number;
    showAboutHIBP: boolean;

    auditPasswordsChanged: () => void;
    auditPasswordEntropyChanged: () => void;
    excludePinsFromAuditChanged: () => void;
    checkPasswordsOnHIBPChanged: () => void;
    showAboutHIBPChanged: () => void;
    auditPasswordAgeChanged: (age: number) => void;
}> = ({
    auditPasswords,
    auditPasswordEntropy,
    excludePinsFromAudit,
    checkPasswordsOnHIBP,
    auditPasswordAge,
    showAboutHIBP,

    auditPasswordsChanged,
    auditPasswordEntropyChanged,
    excludePinsFromAuditChanged,
    checkPasswordsOnHIBPChanged,
    showAboutHIBPChanged,
    auditPasswordAgeChanged
}) => {
    const checkPasswordsOnHIBPClickedInternal = (e: Event) => {
        if ((e.target as HTMLElement).closest('a')) {
            return;
        }
        checkPasswordsOnHIBPChanged();
    };

    return (
        <>
            <h2 id="audit">{Locale.setGenAudit}</h2>
            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-audit-passwords"
                    id="settings__general-audit-passwords"
                    checked={auditPasswords}
                    onClick={auditPasswordsChanged}
                />
                <label for="settings__general-audit-passwords">{Locale.setGenAuditPasswords}</label>
            </div>

            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-audit-password-entropy"
                    id="settings__general-audit-password-entropy"
                    checked={auditPasswordEntropy}
                    onClick={auditPasswordEntropyChanged}
                />
                <label for="settings__general-audit-password-entropy">
                    {Locale.setGenAuditPasswordEntropy}
                </label>
            </div>

            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-exclude-pins-from-audit"
                    id="settings__general-exclude-pins-from-audit"
                    checked={excludePinsFromAudit}
                    onClick={excludePinsFromAuditChanged}
                />
                <label for="settings__general-exclude-pins-from-audit">
                    {Locale.setGenExcludePinsFromAudit}
                </label>
            </div>

            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-check-passwords-on-hibp"
                    id="settings__general-check-passwords-on-hibp"
                    checked={checkPasswordsOnHIBP}
                    onClick={checkPasswordsOnHIBPClickedInternal}
                />
                <label for="settings__general-check-passwords-on-hibp">
                    <LocalizedWith str={Locale.setGenCheckPasswordsOnHIBP}>
                        <a href={Links.HaveIBeenPwned} rel="noreferrer noopener" target="_blank">
                            Have I Been Pwned
                        </a>
                    </LocalizedWith>
                </label>
                <i
                    class="fa fa-info-circle info-btn settings__general-toggle-help-hibp"
                    onClick={showAboutHIBPChanged}
                />
                {showAboutHIBP ? (
                    <div class="settings__general-help-hibp">
                        <LocalizedWith str={Locale.setGenHelpHIBP}>
                            <a
                                href={Links.HaveIBeenPwnedPrivacy}
                                rel="noreferrer noopener"
                                target="_blank"
                            >
                                {Locale.setGenHelpHIBPLink}
                            </a>
                        </LocalizedWith>
                    </div>
                ) : null}
            </div>

            <div>
                <label for="settings__general-audit-password-age">
                    {Locale.setGenAuditPasswordAge}:
                </label>
                <select
                    class="settings__select input-base settings__general-audit-password-age"
                    id="settings__general-audit-password-age"
                    value={auditPasswordAge}
                    onChange={(e) =>
                        auditPasswordAgeChanged(+(e.target as HTMLSelectElement).value)
                    }
                >
                    <option value="0">{Locale.setGenAuditPasswordAgeOff}</option>
                    <option value="1">{Locale.setGenAuditPasswordAgeOneYear}</option>
                    <option value="2">
                        <LocalizedWith str={Locale.setGenAuditPasswordAgeYears}>2</LocalizedWith>
                    </option>
                    <option value="3">
                        <LocalizedWith str={Locale.setGenAuditPasswordAgeYears}>3</LocalizedWith>
                    </option>
                    <option value="5">
                        <LocalizedWith str={Locale.setGenAuditPasswordAgeYears}>5</LocalizedWith>
                    </option>
                    <option value="10">
                        <LocalizedWith str={Locale.setGenAuditPasswordAgeYears}>10</LocalizedWith>
                    </option>
                </select>
            </div>
        </>
    );
};
