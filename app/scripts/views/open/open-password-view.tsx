import * as kdbxweb from 'kdbxweb';
import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { SecureInput, SecureInputEvent } from 'views/components/secure-input';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { useEvent } from 'util/ui/hooks';
import { classes } from 'util/ui/classes';
import { Features } from 'util/features';

export const OpenPasswordView: FunctionComponent<{
    password?: kdbxweb.ProtectedValue;
    passwordReadOnly: boolean;
    passwordPlaceholder: string;
    autoFocusPassword: boolean;
    buttonFingerprint: boolean;
    capsLockPressed: boolean;
    openingFile: boolean;
    showInputError: boolean;

    passwordClicked?: () => void;
    passwordChanged?: (password: kdbxweb.ProtectedValue) => void;
    passwordKeyDown?: (e: KeyboardEvent) => void;
    passwordKeyUp?: (e: KeyboardEvent) => void;
    passwordKeyPress?: (e: KeyboardEvent) => void;
    submitClicked?: () => void;
}> = ({
    password,
    passwordReadOnly,
    passwordPlaceholder,
    passwordChanged,
    buttonFingerprint,
    capsLockPressed,
    openingFile,
    showInputError,

    autoFocusPassword,
    passwordClicked,
    passwordKeyDown,
    passwordKeyUp,
    passwordKeyPress,
    submitClicked
}) => {
    let tabIndex = 200;

    const passwordInput = useRef<HTMLInputElement>();
    const isErrorPresented = useRef(false);

    useEvent('main-window-focus', () => {
        passwordInput.current?.focus();
    });

    useLayoutEffect(() => {
        if (autoFocusPassword && !Features.isMobile) {
            passwordInput.current?.focus();
            if (showInputError) {
                if (!isErrorPresented.current) {
                    isErrorPresented.current = true;
                    passwordInput.current?.select();
                }
            } else {
                isErrorPresented.current = showInputError;
            }
        }
    });

    const passwordInputChanged = (e: SecureInputEvent) => {
        passwordChanged?.(e.value);
    };

    return (
        <>
            <div class="hide">
                {/* we need these inputs to screw browsers passwords autocompletion */}
                <input type="text" name="username" />
                <input type="password" name="password" />
            </div>
            <div class="open__pass-warn-wrap">
                <div
                    class={classes({
                        'open__pass-warning': true,
                        'muted-color': true,
                        'invisible': !capsLockPressed
                    })}
                >
                    <i class="fa fa-exclamation-triangle" /> {Locale.openCaps}
                </div>
            </div>
            <div class="open__pass-field-wrap">
                <SecureInput
                    value={password}
                    inputClass="open__pass-input"
                    name="password"
                    size={30}
                    placeholder={passwordPlaceholder}
                    readonly={passwordReadOnly}
                    tabIndex={++tabIndex}
                    disabled={openingFile}
                    error={showInputError}
                    inputRef={passwordInput}
                    onInput={passwordInputChanged}
                    onClick={passwordReadOnly ? passwordClicked : undefined}
                    onKeyUp={passwordKeyUp}
                    onKeyDown={passwordKeyDown}
                    onKeyPress={passwordKeyPress}
                />
                <div class="open__pass-enter-btn" tabIndex={++tabIndex} onClick={submitClicked}>
                    {buttonFingerprint ? (
                        <i class="fa fa-fingerprint open__pass-enter-btn-icon-touch-id" />
                    ) : (
                        <i class="fa fa-level-down-alt rotate-90 open__pass-enter-btn-icon-enter" />
                    )}
                </div>
                <div class="open__pass-opening-icon">
                    <i class="fa fa-spinner spin" />
                </div>
            </div>
        </>
    );
};
