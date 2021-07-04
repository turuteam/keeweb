import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { SettingsGeneralStorageProvider } from 'ui/settings/general/settings-general-storage-provider';

interface SettingsGeneralStorageProviderItem {
    name: string;
    locName: string;
    enabled: boolean;
    loggedIn: boolean;
    hasConfig: boolean;
}

export const SettingsGeneralStorageView: FunctionComponent<{
    disableOfflineStorage: boolean;
    shortLivedStorageToken: boolean;
    storageProviders: SettingsGeneralStorageProviderItem[];

    disableOfflineStorageChanged: () => void;
    shortLivedStorageTokenChanged: () => void;
    storageEnabledChanged: (storageName: string) => void;
    logoutFromStorage: (storageName: string) => void;
}> = ({
    disableOfflineStorage,
    shortLivedStorageToken,
    storageProviders,

    disableOfflineStorageChanged,
    shortLivedStorageTokenChanged,
    storageEnabledChanged,
    logoutFromStorage
}) => {
    return (
        <>
            <h2 id="storage">{Locale.setGenStorage}</h2>
            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-disable-offline-storage"
                    id="settings__general-disable-offline-storage"
                    checked={disableOfflineStorage}
                    onClick={disableOfflineStorageChanged}
                />
                <label for="settings__general-disable-offline-storage">
                    {Locale.setGenDisableOfflineStorage}
                </label>
            </div>
            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-short-lived-storage-token"
                    id="settings__general-short-lived-storage-token"
                    checked={shortLivedStorageToken}
                    onClick={shortLivedStorageTokenChanged}
                />
                <label for="settings__general-short-lived-storage-token">
                    {Locale.setGenShortLivedStorageToken}
                </label>
            </div>

            {storageProviders.map((prv) => (
                <div key={prv.name}>
                    <h4 class="settings__general-storage-header">
                        <input
                            type="checkbox"
                            id={`settings__general-prv-check-${prv.name}`}
                            class="settings__general-prv-check"
                            checked={prv.enabled}
                            onClick={() => storageEnabledChanged(prv.name)}
                        />
                        <label for={`settings__general-prv-check-${prv.name}`}>{prv.locName}</label>
                    </h4>
                    {prv.enabled && prv.hasConfig ? (
                        <div class={`settings__general-prv-wrap settings__general-${prv.name}`}>
                            <SettingsGeneralStorageProvider name={prv.name} />
                        </div>
                    ) : null}
                    {prv.loggedIn ? (
                        <button
                            class="btn-silent settings__general-prv-logout"
                            onClick={() => logoutFromStorage(prv.name)}
                        >
                            {Locale.setGenStorageLogout}
                        </button>
                    ) : null}
                </div>
            ))}
        </>
    );
};
