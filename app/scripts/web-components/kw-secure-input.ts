import * as kdbxweb from 'kdbxweb';
import preact from 'preact';
import { Timeouts } from 'const/timeouts';

declare module 'preact' {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'kw-secure-input': Partial<preact.JSX.HTMLAttributes<KwSecureInput>>;
        }
    }
}

const MaxLength = 1024;

export class KwSecureInput extends HTMLElement {
    private input?: HTMLInputElement;

    private readonly minChar = 0x1400 + Math.round(Math.random() * 100);
    private length = 0;
    private pseudoValue = '';
    private salt = new Uint32Array(0);

    protected connectedCallback(): void {
        this.input = document.createElement('input');
        this.input.type = 'password';
        this.input.autocomplete = 'new-password';
        this.input.maxLength = MaxLength;
        this.input.className = 'secure-input';
        for (const attr of KwSecureInput.observedAttributes) {
            const value = this.getAttribute(attr);
            if (typeof value === 'string') {
                this.input.setAttribute(attr, value);
            }
        }

        this.input.addEventListener('input', () => this.internalInput());

        // this.attachShadow({ mode: 'open', delegatesFocus: true });
        // this.shadowRoot?.append(this.input);
        this.append(this.input);
    }

    protected static get observedAttributes(): string[] {
        return ['autofocus', 'readonly', 'size', 'placeholder', 'tabindex'];
    }

    protected attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null
    ): void {
        if (typeof newValue === 'string') {
            this.input?.setAttribute(name, newValue);
        } else {
            this.input?.removeAttribute(name);
        }
    }

    focus(): void {
        this.input?.focus();
    }

    shake(): void {
        this.input?.classList.add('input-shake');
        setTimeout(() => this.input?.classList.remove('input-shake'), Timeouts.InputShake);
    }

    reset(): void {
        this.length = 0;
        this.pseudoValue = '';

        if (this.salt) {
            for (let i = 0; i < this.salt.length; i++) {
                this.salt[i] = 0;
            }
        }
        this.salt = new Uint32Array(0);
    }

    get value(): kdbxweb.ProtectedValue {
        const pseudoValue = this.pseudoValue;
        const salt = this.salt;
        const len = pseudoValue.length;
        let byteLength = 0;
        const valueBytes = new Uint8Array(len * 4);
        const saltBytes = kdbxweb.CryptoEngine.random(len * 4);
        let ch;
        let bytes;
        for (let i = 0; i < len; i++) {
            const pseudoCharCode = pseudoValue.charCodeAt(i);
            ch = String.fromCharCode(salt[i] ^ pseudoCharCode);
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

    private getChar(ix: number): string {
        return String.fromCharCode(this.minChar + ix);
    }

    private isSpecialChar(ch: number): boolean {
        return ch >= this.minChar && ch <= this.minChar + MaxLength;
    }

    private internalInput() {
        const input = this.input;
        if (!input) {
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
            const psCh = this.pseudoValue.charCodeAt(psIx);
            const isSpecial = this.isSpecialChar(valCh);
            if (psCh === valCh) {
                // not changed
                newPs += this.getChar(newPs.length);
                newSalt[newPs.length - 1] =
                    psCh ^ this.salt[psIx] ^ newPs.charCodeAt(newPs.length - 1);
                psIx++;
                valIx++;
            } else if (isSpecial) {
                // deleted
                psIx++;
            } else {
                // inserted or replaced
                newPs += this.getChar(newPs.length);
                newSalt[newPs.length - 1] = newPs.charCodeAt(newPs.length - 1) ^ valCh;
                valIx++;
            }
        }
        this.length = newPs.length;
        this.pseudoValue = newPs;
        this.salt = newSalt;
        input.value = newPs;
        input.selectionStart = selStart;
        input.selectionEnd = selStart;
    }
}

customElements.define('kw-secure-input', KwSecureInput);
