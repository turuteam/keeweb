import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { LocalizedWith } from 'views/components/localized-with';
import { AppSettingsDeviceOwnerAuth, AppSettingsRememberKeyFiles } from 'models/app-settings';
import { StringFormat } from 'util/formatting/string-format';

export const SettingsGeneralFunctionView: FunctionComponent<{
    canAutoSaveOnClose: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
    rememberKeyFiles: AppSettingsRememberKeyFiles | null;
    supportFiles: boolean;
    canClearClipboard: boolean;
    clipboardSeconds: number;
    canMinimize: boolean;
    minimizeOnClose: boolean;
    minimizeOnFieldCopy: boolean;
    canAutoType: boolean;
    directAutotype: boolean;
    autoTypeTitleFilterEnabled: boolean;
    fieldLabelDblClickAutoType: boolean;
    useMarkdown: boolean;
    useGroupIconForEntries: boolean;
    hasDeviceOwnerAuth: boolean;
    deviceOwnerAuth: AppSettingsDeviceOwnerAuth | null;
    deviceOwnerAuthTimeout: number;
}> = ({
    canAutoSaveOnClose,
    autoSave,
    autoSaveInterval,
    rememberKeyFiles,
    supportFiles,
    canClearClipboard,
    clipboardSeconds,
    canMinimize,
    minimizeOnClose,
    minimizeOnFieldCopy,
    canAutoType,
    directAutotype,
    autoTypeTitleFilterEnabled,
    fieldLabelDblClickAutoType,
    useMarkdown,
    useGroupIconForEntries,
    hasDeviceOwnerAuth,
    deviceOwnerAuth,
    deviceOwnerAuthTimeout
}) => {
    return (
        <>
            <h2 id="function">{Locale.setGenFunction}</h2>
            {canAutoSaveOnClose ? (
                <div>
                    <input
                        type="checkbox"
                        class="settings__input input-base settings__general-auto-save"
                        id="settings__general-auto-save"
                        checked={autoSave}
                    />
                    <label for="settings__general-auto-save">{Locale.setGenAutoSyncOnClose}</label>
                </div>
            ) : null}
            <div>
                <label for="settings__general-auto-save-interval">
                    {Locale.setGenAutoSyncTimer}:
                </label>
                <select
                    class="settings__select input-base settings__general-auto-save-interval"
                    id="settings__general-auto-save-interval"
                    value={autoSaveInterval}
                >
                    <option value="0">{Locale.setGenAutoSyncTimerOff}</option>
                    <option value="-1">{Locale.setGenAutoSyncTimerOnChange}</option>
                    <option value="1">
                        <LocalizedWith str={Locale.setGenAutoSyncTimerInterval}>1</LocalizedWith>
                    </option>
                    <option value="5">
                        <LocalizedWith str={Locale.setGenAutoSyncTimerInterval}>5</LocalizedWith>
                    </option>
                    <option value="15">
                        <LocalizedWith str={Locale.setGenAutoSyncTimerInterval}>15</LocalizedWith>
                    </option>
                    <option value="30">
                        <LocalizedWith str={Locale.setGenAutoSyncTimerInterval}>30</LocalizedWith>
                    </option>
                    <option value="60">
                        <LocalizedWith str={Locale.setGenAutoSyncTimerInterval}>60</LocalizedWith>
                    </option>
                </select>
            </div>
            <div>
                <label for="settings__general-remember-key-files">
                    {Locale.setGenRememberKeyFiles}:
                </label>
                <select
                    class="settings__general-remember-key-files settings__select input-base"
                    id="settings__general-remember-key-files"
                >
                    <option value="" selected={!rememberKeyFiles}>
                        {Locale.setGenNoRememberKeyFiles}
                    </option>
                    <option value="data" selected={rememberKeyFiles === 'data'}>
                        {Locale.setGenRememberKeyFilesData}
                    </option>
                    {supportFiles ? (
                        <option value="path" selected={rememberKeyFiles === 'path'}>
                            {Locale.setGenRememberKeyFilesPath}
                        </option>
                    ) : null}
                </select>
            </div>
            {canClearClipboard ? (
                <div>
                    <label for="settings__general-clipboard">{Locale.setGenClearClip}:</label>
                    <select
                        class="settings__general-clipboard settings__select input-base"
                        id="settings__general-clipboard"
                        value={clipboardSeconds}
                    >
                        <option value="0">{Locale.setGenNoClear}</option>
                        <option value="5">
                            <LocalizedWith str={Locale.setGenClearSeconds}>5</LocalizedWith>
                        </option>
                        <option value="10">
                            <LocalizedWith str={Locale.setGenClearSeconds}>10</LocalizedWith>
                        </option>
                        <option value="15">
                            <LocalizedWith str={Locale.setGenClearSeconds}>15</LocalizedWith>
                        </option>
                        <option value="60">{Locale.setGenClearMinute}</option>
                    </select>
                </div>
            ) : null}
            {canMinimize ? (
                <>
                    <div>
                        <input
                            type="checkbox"
                            class="settings__input input-base settings__general-minimize"
                            id="settings__general-minimize"
                            checked={minimizeOnClose}
                        />
                        <label for="settings__general-minimize">{Locale.setGenMinInstead}</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            class="settings__input input-base settings__general-minimize-on-field-copy"
                            id="settings__general-minimize-on-field-copy"
                            checked={minimizeOnFieldCopy}
                        />
                        <label for="settings__general-minimize-on-field-copy">
                            {Locale.setGenMinOnFieldCopy}
                        </label>
                    </div>
                </>
            ) : null}
            {canAutoType ? (
                <>
                    <div>
                        <input
                            type="checkbox"
                            class="settings__input input-base settings__general-direct-autotype"
                            id="settings__general-direct-autotype"
                            checked={directAutotype}
                        />
                        <label for="settings__general-direct-autotype">
                            {Locale.setGenDirectAutotype}
                        </label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            class="settings__input input-base settings__general-autotype-title-filter"
                            id="settings__general-autotype-title-filter"
                            checked={autoTypeTitleFilterEnabled}
                        />
                        <label for="settings__general-autotype-title-filter">
                            {Locale.setGenAutoTypeTitleFilterEnabled}
                        </label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            class="settings__input input-base settings__general-field-label-dblclick-autotype"
                            id="settings__general-field-label-dblclick-autotype"
                            checked={fieldLabelDblClickAutoType}
                        />
                        <label for="settings__general-field-label-dblclick-autotype">
                            {Locale.setGenFieldLabelDblClickAutoType}
                        </label>
                    </div>
                </>
            ) : null}
            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-use-markdown"
                    id="settings__general-use-markdown"
                    checked={useMarkdown}
                />
                <label for="settings__general-use-markdown">{Locale.setGenUseMarkdown}</label>
            </div>
            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-use-group-icon-for-entries"
                    id="settings__general-use-group-icon-for-entries"
                    checked={useGroupIconForEntries}
                />
                <label for="settings__general-use-group-icon-for-entries">
                    {Locale.setGenUseGroupIconForEntries}
                </label>
            </div>
            {hasDeviceOwnerAuth ? (
                <>
                    <div>
                        <label for="settings__general-device-owner-auth">
                            {Locale.setGenTouchId}:
                        </label>
                        <select
                            class="settings__general-device-owner-auth settings__select input-base"
                            id="settings__general-device-owner-auth"
                        >
                            <option value="" selected={!deviceOwnerAuth}>
                                {Locale.setGenTouchIdDisabled}
                            </option>
                            <option value="memory" selected={deviceOwnerAuth === 'memory'}>
                                {Locale.setGenTouchIdMemory}
                            </option>
                            <option value="file" selected={deviceOwnerAuth === 'file'}>
                                {Locale.setGenTouchIdFile}
                            </option>
                        </select>
                    </div>
                    {deviceOwnerAuth ? (
                        <>
                            <label for="settings__general-device-owner-auth-timeout">
                                {Locale.setGenTouchIdPass}:
                            </label>
                            <select
                                class="settings__general-device-owner-auth-timeout settings__select input-base"
                                id="settings__general-device-owner-auth-timeout"
                                value={deviceOwnerAuthTimeout}
                            >
                                <option value="1">{StringFormat.capFirst(Locale.oneMinute)}</option>
                                <option value="5">
                                    <LocalizedWith str={Locale.minutes} capitalize={true}>
                                        5
                                    </LocalizedWith>
                                </option>
                                <option value="30">
                                    <LocalizedWith str={Locale.minutes} capitalize={true}>
                                        30
                                    </LocalizedWith>
                                </option>
                                <option value="60">{StringFormat.capFirst(Locale.oneHour)}</option>
                                <option value="120">
                                    <LocalizedWith str={Locale.hours} capitalize={true}>
                                        2
                                    </LocalizedWith>
                                </option>
                                <option value="480">
                                    <LocalizedWith str={Locale.hours} capitalize={true}>
                                        8
                                    </LocalizedWith>
                                </option>
                                <option value="1440">{StringFormat.capFirst(Locale.oneDay)}</option>
                                <option value="10080">
                                    {StringFormat.capFirst(Locale.oneWeek)}
                                </option>
                                {deviceOwnerAuth === 'file' ? (
                                    <option value="43200">
                                        {StringFormat.capFirst(Locale.oneMonth)}
                                    </option>
                                ) : null}
                                {deviceOwnerAuth === 'file' ? (
                                    <option value="525600">
                                        {StringFormat.capFirst(Locale.oneYear)}
                                    </option>
                                ) : null}
                            </select>
                        </>
                    ) : null}
                </>
            ) : null}
        </>
    );
};
