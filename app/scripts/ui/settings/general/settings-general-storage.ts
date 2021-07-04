import { FunctionComponent, h } from 'preact';
import { SettingsGeneralStorageView } from 'views/settings/general/settings-general-storage-view';
import { AppSettings } from 'models/app-settings';
import { Storage } from 'storage';

export const SettingsGeneralStorage: FunctionComponent = () => {
    const getStorageProviders = () => {
        const storageProviders = Object.values(Storage.getAll()).filter((prv) => !prv.system);
        storageProviders.sort((x, y) => (x.uipos || Infinity) - (y.uipos || Infinity));
        return storageProviders.map((sp) => ({
            name: sp.name,
            locName: sp.locName,
            enabled: sp.enabled,
            hasConfig: !!sp.getSettingsConfig,
            loggedIn: sp.loggedIn
        }));
    };

    return h(SettingsGeneralStorageView, {
        disableOfflineStorage: AppSettings.disableOfflineStorage,
        shortLivedStorageToken: AppSettings.shortLivedStorageToken,
        storageProviders: getStorageProviders()
    });
};
