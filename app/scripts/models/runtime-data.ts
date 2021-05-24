import { Model } from 'util/model';
import { SettingsStore } from 'comp/settings/settings-store';
import { noop } from 'util/fn';
import { Logger } from 'util/logger';
import {
    NonFunctionPropertyNames,
    OptionalBooleanPropertyNames,
    OptionalDatePropertyNames,
    OptionalStringPropertyNames
} from 'util/types';

const logger = new Logger('runtime-data');

let changeListener: () => void;

class RuntimeData extends Model {
    skipFolderRightsWarning?: boolean;
    lastSuccessUpdateCheckDate?: Date;
    lastUpdateCheckDate?: Date;
    lastUpdateVersion?: string;
    lastUpdateVersionReleaseDate?: Date;
    lastUpdateCheckError?: string;

    async init(): Promise<void> {
        await this.load();

        changeListener = () => this.save().catch(noop);
        this.on('change', changeListener);
    }

    disableSaveOnChange(): void {
        this.off('change', changeListener);
    }

    reset() {
        const thisRec = this as Record<string, unknown>;
        for (const key of Object.keys(thisRec)) {
            delete thisRec[key];
        }
    }

    private async load() {
        const data = await SettingsStore.load('runtime-data');
        if (data) {
            this.batchSet(() => {
                for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
                    if (!this.set(key, value)) {
                        logger.warn('Bad property', key, value);
                    }
                }
            });
        }
    }

    set(key: string, value: unknown): boolean {
        const isSet = this.setInternal(key, value);

        if (isSet === undefined) {
            const thisRec = this as Record<string, unknown>;
            thisRec[key] = value;
            return true;
        } else {
            return isSet;
        }
    }

    setInternal(key: string, value: unknown): boolean {
        switch (key as NonFunctionPropertyNames<RuntimeData>) {
            case 'skipFolderRightsWarning':
                return this.setBoolean('skipFolderRightsWarning', value);
            case 'lastSuccessUpdateCheckDate':
                return this.setDate('lastSuccessUpdateCheckDate', value);
            case 'lastUpdateCheckDate':
                return this.setDate('lastUpdateCheckDate', value);
            case 'lastUpdateVersion':
                return this.setString('lastUpdateVersion', value);
            case 'lastUpdateVersionReleaseDate':
                return this.setDate('lastUpdateVersionReleaseDate', value);
            case 'lastUpdateCheckError':
                return this.setString('lastUpdateCheckError', value);
        }
    }

    get(key: string): unknown {
        const thisRec = this as Record<string, unknown>;
        return thisRec[key];
    }

    delete(key: string): void {
        const thisRec = this as Record<string, unknown>;
        delete thisRec[key];
    }

    async save() {
        await SettingsStore.save('runtime-data', this);
    }

    toJSON(): Record<string, unknown> {
        return Object.fromEntries(
            Object.entries(this).filter(([, value]) => !!value !== undefined)
        );
    }

    private setBoolean(
        key: NonNullable<OptionalBooleanPropertyNames<RuntimeData>>,
        value: unknown
    ): boolean {
        if (typeof value === 'boolean') {
            this[key] = value;
            return true;
        }
        if (!value) {
            delete this[key];
            return true;
        }
        return false;
    }

    private setString(
        key: NonNullable<OptionalStringPropertyNames<RuntimeData>>,
        value: unknown
    ): boolean {
        if (typeof value === 'string') {
            this[key] = value;
            return true;
        }
        if (!value) {
            delete this[key];
            return true;
        }
        return false;
    }

    private setDate(
        key: NonNullable<OptionalDatePropertyNames<RuntimeData>>,
        value: unknown
    ): boolean {
        if (!value) {
            delete this[key];
            return true;
        }
        if (typeof value === 'string') {
            const dt = new Date(value);
            if (dt.getTime()) {
                this[key] = dt;
                return true;
            } else {
                return false;
            }
        }
        if (typeof value === 'number') {
            this[key] = new Date(value);
            return true;
        }
        if (value instanceof Date) {
            this[key] = value;
            return true;
        }
        return false;
    }
}

const instance = new RuntimeData();

export { instance as RuntimeData };
