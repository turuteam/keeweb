import { AppSettingsFieldName, AppSettings } from 'models/app-settings';
import { RuntimeData } from 'models/runtime-data';

const ExportApi = {
    settings: {
        get(key?: AppSettingsFieldName): unknown {
            return key ? AppSettings[key] : { ...AppSettings };
        },
        set(key: AppSettingsFieldName, value: unknown): boolean {
            return AppSettings.set(key, value);
        },
        del(key: AppSettingsFieldName): void {
            AppSettings.delete(key);
        }
    },
    runtimeData: {
        get(key?: string): unknown {
            return key ? RuntimeData.get(key) : { ...RuntimeData };
        },
        set(key: string, value: unknown): boolean {
            return RuntimeData.set(key, value);
        },
        del(key: string): void {
            RuntimeData.delete(key);
        }
    }
};

export { ExportApi };
