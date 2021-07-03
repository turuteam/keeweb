import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { SettingsGeneralUpdate } from 'ui/settings/general/settings-general-update';
import { SettingsGeneralAppearance } from 'ui/settings/general/settings-general-appearance';
import { SettingsGeneralFunction } from 'ui/settings/general/settings-general-function';
import { SettingsGeneralAudit } from 'ui/settings/general/settings-general-audit';
import { SettingsGeneralLock } from 'ui/settings/general/settings-general-lock';
import { SettingsGeneralStorage } from 'ui/settings/general/settings-general-storage';
import { SettingsGeneralAdvanced } from 'ui/settings/general/settings-general-advanced';

export const SettingsGeneralView: FunctionComponent = () => {
    return (
        <div class="settings__content">
            <h1 id="top">
                <i class="fa fa-cog settings__head-icon" /> {Locale.setGenTitle}
            </h1>

            <SettingsGeneralUpdate />
            <SettingsGeneralAppearance />
            <SettingsGeneralFunction />
            <SettingsGeneralAudit />
            <SettingsGeneralLock />
            <SettingsGeneralStorage />
            <SettingsGeneralAdvanced />
        </div>
    );
};
