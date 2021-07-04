import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { LocalizedWith } from 'views/components/localized-with';

export const SettingsGeneralLockView: FunctionComponent<{
    idleMinutes: number;
    canDetectMinimize: boolean;
    lockOnMinimize: boolean;
    lockOnCopy: boolean;
    canAutoType: boolean;
    lockOnAutoType: boolean;
    canDetectOsSleep: boolean;
    lockOnOsLock: boolean;
}> = ({
    idleMinutes,
    canDetectMinimize,
    lockOnMinimize,
    lockOnCopy,
    canAutoType,
    lockOnAutoType,
    canDetectOsSleep,
    lockOnOsLock
}) => {
    return (
        <>
            <h2 id="lock">{Locale.setGenLock}</h2>
            <div>
                <label for="settings__general-idle-minutes">{Locale.setGenLockInactive}:</label>
                <select
                    class="settings__general-idle-minutes settings__select input-base"
                    id="settings__general-idle-minutes"
                    value={idleMinutes}
                >
                    <option value="0">{Locale.setGenNoAutoLock}</option>
                    <option value="5">
                        <LocalizedWith str={Locale.setGenLockMinutes}>5</LocalizedWith>
                    </option>
                    <option value="10">
                        <LocalizedWith str={Locale.setGenLockMinutes}>10</LocalizedWith>
                    </option>
                    <option value="15">
                        <LocalizedWith str={Locale.setGenLockMinutes}>15</LocalizedWith>
                    </option>
                    <option value="30">
                        <LocalizedWith str={Locale.setGenLockMinutes}>30</LocalizedWith>
                    </option>
                    <option value="60">{Locale.setGenLockHour}</option>
                    <option value="180">
                        <LocalizedWith str={Locale.setGenLockHours}>3</LocalizedWith>
                    </option>
                    <option value="360">
                        <LocalizedWith str={Locale.setGenLockHours}>6</LocalizedWith>
                    </option>
                    <option value="720">
                        <LocalizedWith str={Locale.setGenLockHours}>12</LocalizedWith>
                    </option>
                    <option value="1440">{Locale.setGenLockDay}</option>
                </select>
            </div>

            {canDetectMinimize ? (
                <div>
                    <input
                        type="checkbox"
                        class="settings__input input-base settings__general-lock-on-minimize"
                        id="settings__general-lock-on-minimize"
                        checked={lockOnMinimize}
                    />
                    <label for="settings__general-lock-on-minimize">
                        {Locale.setGenLockMinimize}
                    </label>
                </div>
            ) : null}

            <div>
                <input
                    type="checkbox"
                    class="settings__input input-base settings__general-lock-on-copy"
                    id="settings__general-lock-on-copy"
                    checked={lockOnCopy}
                />
                <label for="settings__general-lock-on-copy">{Locale.setGenLockCopy}</label>
            </div>

            {canAutoType ? (
                <div>
                    <input
                        type="checkbox"
                        class="settings__input input-base settings__general-lock-on-auto-type"
                        id="settings__general-lock-on-auto-type"
                        checked={lockOnAutoType}
                    />
                    <label for="settings__general-lock-on-auto-type">
                        {Locale.setGenLockAutoType}
                    </label>
                </div>
            ) : null}

            {canDetectOsSleep ? (
                <div>
                    <input
                        type="checkbox"
                        class="settings__input input-base settings__general-lock-on-os-lock"
                        id="settings__general-lock-on-os-lock"
                        checked={lockOnOsLock}
                    />
                    <label for="settings__general-lock-on-os-lock">
                        {Locale.setGenLockOrSleep}
                    </label>
                </div>
            ) : null}
        </>
    );
};
