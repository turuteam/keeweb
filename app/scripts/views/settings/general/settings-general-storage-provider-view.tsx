import { FunctionComponent } from 'preact';
import { StorageConfigField } from 'storage/types';

export const SettingsGeneralStorageProviderView: FunctionComponent<{
    name: string;
    fields: StorageConfigField[];

    fieldChanged: (id: string, value: string | null) => void;
}> = ({ name, fields, fieldChanged }) => {
    const inputChanged = (e: Event, fieldId: string) => {
        const input = e.target as HTMLInputElement;
        if (!input?.checkValidity()) {
            return;
        }
        fieldChanged(fieldId, input.value);
    };

    return (
        <div class={`settings__general-prv settings__general-prv-${name}`}>
            <div class="settings__general-prv-fields">
                {fields.map((field) =>
                    field.type === 'select' ? (
                        <div>
                            <label for={`settings__general-prv-field-sel-${field.id}`}>
                                {field.title}:
                            </label>
                            <select
                                class="settings__select input-base settings__general-prv-field settings__general-prv-field-sel"
                                id={`settings__general-prv-field-sel-${field.id}`}
                                data-id={field.id}
                                value={field.value || ''}
                                onChange={(e) =>
                                    fieldChanged(field.id, (e.target as HTMLSelectElement).value)
                                }
                            >
                                {Object.entries(field.options).map(([fieldValue, fieldTitle]) => (
                                    <option key={fieldValue} value={fieldValue}>
                                        {fieldTitle}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : field.type === 'checkbox' ? (
                        <div>
                            <input
                                type="checkbox"
                                class="input-base settings__general-prv-field settings__input settings__general-prv-field-check"
                                id={`settings__general-prv-field-check-${field.id}`}
                                checked={!!field.value}
                                value={field.value || ''}
                                data-id={field.id}
                                onClick={(e) =>
                                    fieldChanged(
                                        field.id,
                                        (e.target as HTMLInputElement).checked ? 'true' : null
                                    )
                                }
                            />
                            <label for={`settings__general-prv-field-check-${field.id}`}>
                                {field.title}
                            </label>
                            {field.desc ? (
                                <div class="settings__general-prv-field-desc muted-color">
                                    {field.desc}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div>
                            <label for={`settings__general-prv-field-txt-${field.id}`}>
                                {field.title}:
                            </label>
                            {field.desc ? (
                                <div class="settings__general-prv-field-desc muted-color">
                                    {field.desc}
                                </div>
                            ) : null}
                            <input
                                type={field.type}
                                class="input-base settings__general-prv-field settings__input settings__general-prv-field-txt"
                                id={`settings__general-prv-field-txt-${field.id}`}
                                autocomplete="off"
                                value={field.value || ''}
                                data-id={field.id}
                                placeholder={field.placeholder}
                                required={field.required}
                                pattern={field.pattern}
                                onInput={(e) => inputChanged(e, field.id)}
                            />
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
