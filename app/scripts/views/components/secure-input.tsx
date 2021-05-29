import * as kdbxweb from 'kdbxweb';
import { FunctionComponent } from 'preact';
import { Ref, useRef } from 'preact/hooks';
import { classes } from 'util/ui/classes';

const MaxLength = 1024;

export interface SecureInputEvent extends InputEvent {
    value: kdbxweb.ProtectedValue;
}

export const SecureInput: FunctionComponent<{
    name?: string;
    inputClass?: string;
    error?: boolean;
    readonly?: boolean;
    disabled?: boolean;
    size?: number;
    placeholder?: string;
    tabIndex?: number;
    inputRef?: Ref<HTMLInputElement>;
    value?: kdbxweb.ProtectedValue;

    onInput?: (e: SecureInputEvent) => void;
    onClick?: (e: MouseEvent) => void;
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
    onKeyPress?: (e: KeyboardEvent) => void;
}> = ({
    name,
    inputClass,
    error,
    readonly,
    disabled,
    size,
    placeholder,
    tabIndex,
    inputRef,
    value,

    onInput,
    onClick,
    onKeyDown,
    onKeyUp,
    onKeyPress
}) => {
    const minChar = useRef(0x1400 + Math.round(Math.random() * 100));
    const length = useRef(0);
    const pseudoValue = useRef('');
    const salt = useRef(new Uint32Array(0));
    const lastValue = useRef(value ?? kdbxweb.ProtectedValue.fromString(''));

    let realInputValue: string | undefined;

    if (value && lastValue.current && !value.equals(lastValue.current)) {
        if (value.length === 0) {
            realInputValue = '';
            pseudoValue.current = '';
            salt.current = new Uint32Array(0);
        } else {
            throw new Error('Setting a new value in SecureInput is not supported');
        }
    }

    const onInternalInput = (e: Event) => {
        const input = e.target;
        if (!(input instanceof HTMLInputElement)) {
            return;
        }

        const selStart = input.selectionStart;
        const value = input.value;

        let newPs = '';
        const newSalt = new Uint32Array(MaxLength);
        let valIx = 0,
            psIx = 0;
        while (valIx < value.length) {
            const valCh = value.charCodeAt(valIx);
            const psCh = pseudoValue.current.charCodeAt(psIx);
            const isSpecial = isSpecialChar(valCh);
            if (psCh === valCh) {
                // not changed
                newPs += getChar(newPs.length);
                newSalt[newPs.length - 1] =
                    psCh ^ salt.current[psIx] ^ newPs.charCodeAt(newPs.length - 1);
                psIx++;
                valIx++;
            } else if (isSpecial) {
                // deleted
                psIx++;
            } else {
                // inserted or replaced
                newPs += getChar(newPs.length);
                newSalt[newPs.length - 1] = newPs.charCodeAt(newPs.length - 1) ^ valCh;
                valIx++;
            }
        }
        length.current = newPs.length;
        pseudoValue.current = newPs;
        salt.current = newSalt;

        input.value = newPs;
        input.selectionStart = selStart;
        input.selectionEnd = selStart;

        lastValue.current = getValue();

        const ev = e as SecureInputEvent;
        ev.value = lastValue.current;

        onInput?.(ev);
    };

    function getChar(ix: number): string {
        return String.fromCharCode(minChar.current + ix);
    }

    function isSpecialChar(ch: number): boolean {
        return ch >= minChar.current && ch <= minChar.current + MaxLength;
    }

    function getValue(): kdbxweb.ProtectedValue {
        const len = pseudoValue.current.length;
        let byteLength = 0;
        const valueBytes = new Uint8Array(len * 4);
        const saltBytes = kdbxweb.CryptoEngine.random(len * 4);
        let ch;
        let bytes;
        for (let i = 0; i < len; i++) {
            const pseudoCharCode = pseudoValue.current.charCodeAt(i);
            ch = String.fromCharCode(salt.current[i] ^ pseudoCharCode);
            bytes = kdbxweb.ByteUtils.stringToBytes(ch);
            for (let j = 0; j < bytes.length; j++) {
                valueBytes[byteLength] = bytes[j] ^ saltBytes[byteLength];
                byteLength++;
            }
        }
        return new kdbxweb.ProtectedValue(
            valueBytes.buffer.slice(0, byteLength),
            saltBytes.buffer.slice(0, byteLength)
        );
    }

    return (
        <input
            name={name}
            class={classes({
                'secure-input': true,
                'input--shake': error,
                'input--error': error,
                ...(inputClass ? { [inputClass]: true } : null)
            })}
            type="password"
            autocomplete="new-password"
            maxLength={MaxLength}
            tabIndex={tabIndex}
            placeholder={placeholder}
            readonly={readonly}
            disabled={disabled}
            size={size}
            ref={inputRef}
            value={realInputValue}
            onInput={onInternalInput}
            onClick={onClick}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onKeyPress={onKeyPress}
        />
    );
};
