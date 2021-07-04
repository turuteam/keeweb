import { FunctionComponent, h } from 'preact';
import { SettingsGeneralStorageView } from 'views/settings/general/settings-general-storage-view';
import { AppSettings, AppSettingsFieldName } from 'models/app-settings';
import { Storage } from 'storage';
import { FileController } from 'comp/app/file-controller';
import { useModelWatcher } from 'util/ui/hooks';
import { RuntimeData } from 'models/runtime-data';

export const SettingsGeneralStorage: FunctionComponent = () => {
    useModelWatcher(RuntimeData);

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

    const disableOfflineStorageChanged = () => {
        AppSettings.disableOfflineStorage = !AppSettings.disableOfflineStorage;
        if (AppSettings.disableOfflineStorage) {
            FileController.deleteAllCachedFiles();
        }
    };

    const shortLivedStorageTokenChanged = () => {
        AppSettings.shortLivedStorageToken = !AppSettings.shortLivedStorageToken;
        if (AppSettings.shortLivedStorageToken) {
            FileController.deleteAllStoredTokens();
        }
    };

    const storageEnabledChanged = (storageName: string) => {
        const storage = Storage.get(storageName);
        if (!storage) {
            return;
        }

        AppSettings.set(storage.name as AppSettingsFieldName, !storage.enabled);
    };

    const logoutFromStorage = (storageName: string) => {
        Storage.get(storageName)?.logout();
    };

    return h(SettingsGeneralStorageView, {
        disableOfflineStorage: AppSettings.disableOfflineStorage,
        shortLivedStorageToken: AppSettings.shortLivedStorageToken,
        storageProviders: getStorageProviders(),

        disableOfflineStorageChanged,
        shortLivedStorageTokenChanged,
        storageEnabledChanged,
        logoutFromStorage
    });
};
