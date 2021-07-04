import { FunctionComponent, h } from 'preact';
import { SettingsGeneralStorageProviderView } from 'views/settings/general/settings-general-storage-provider-view';
import { Storage } from 'storage';

export const SettingsGeneralStorageProvider: FunctionComponent<{ name: string }> = ({ name }) => {
    const storage = Storage.get(name);
    if (!storage) {
        return null;
    }

    const config = storage.getSettingsConfig?.();
    if (!config) {
        return null;
    }

    const fieldChanged = (id: string, value: string | null) => {
        storage.applySetting?.(id, value);
    };

    return h(SettingsGeneralStorageProviderView, {
        name,
        fields: config.fields,

        fieldChanged
    });
};
