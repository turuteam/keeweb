import { Model } from 'util/model';
import { SettingsStore } from 'comp/settings/settings-store';
import { noop } from 'util/fn';
import { Logger } from 'util/logger';
import { NonFunctionPropertyNames, OptionalBooleanPropertyNames } from 'util/types';

const logger = new Logger('runtime-data');

let changeListener: () => void;

class RuntimeDataModel extends Model {
    skipFolderRightsWarning?: boolean;

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
        switch (key as NonFunctionPropertyNames<RuntimeDataModel>) {
            case 'skipFolderRightsWarning':
                return this.setBoolean('skipFolderRightsWarning', value);
        }
        const thisRec = this as Record<string, unknown>;
        thisRec[key] = value;
        return true;
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
        key: NonNullable<OptionalBooleanPropertyNames<RuntimeDataModel>>,
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
        return true;
    }
}

const instance = new RuntimeDataModel();

export { instance as RuntimeDataModel };
