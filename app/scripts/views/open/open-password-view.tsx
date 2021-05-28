import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { SecureInput } from 'views/components/secure-input';
import { useRef } from 'preact/hooks';
import { useEvent } from 'util/ui/hooks';

export const OpenPasswordView: FunctionComponent<{
    canOpen: boolean;
}> = ({ canOpen }) => {
    let tabIndex = 0;

    const passwordInputRef = useRef<HTMLInputElement>();

    useEvent('main-window-focus', () => {
        passwordInputRef.current?.focus();
    });

    return (
        <>
            <input type="file" class="open__file-ctrl hide-by-pos" />
            <div class="hide">
                {/* we need these inputs to screw browsers passwords autocompletion */}
                <input type="text" name="username" />
                <input type="password" name="password" />
            </div>
            <div class="open__pass-warn-wrap">
                <div class="open__pass-warning muted-color invisible">
                    <i class="fa fa-exclamation-triangle" /> {Locale.openCaps}
                </div>
            </div>
            <div class="open__pass-field-wrap">
                <SecureInput
                    inputClass="open__pass-input"
                    name="password"
                    size={30}
                    placeholder={canOpen ? Locale.openClickToOpen : ''}
                    readonly={true}
                    tabIndex={++tabIndex}
                    inputRef={passwordInputRef}
                />
                <div class="open__pass-enter-btn" tabIndex={++tabIndex}>
                    <i class="fa fa-level-down-alt rotate-90 open__pass-enter-btn-icon-enter" />
                    <i class="fa fa-fingerprint open__pass-enter-btn-icon-touch-id" />
                </div>
                <div class="open__pass-opening-icon">
                    <i class="fa fa-spinner spin" />
                </div>
            </div>
        </>
    );
};
