import { FunctionComponent, h, render } from 'preact';
import { Locale } from 'util/locale';
import { Modal, ModalEmitterEvents } from 'ui/modal';
import { TypedEmitter } from 'tiny-typed-emitter';
import { Timeouts } from 'const/timeouts';
import { KeyHandler } from 'comp/browser/key-handler';
import { Keys } from 'const/keys';
import { Callback } from 'util/types';
import { FocusManager } from 'comp/app/focus-manager';

export interface AlertButton {
    result: string;
    title: string;
    error?: boolean;
    silent?: boolean;
}

export interface AlertConfig {
    header: string;
    body: string | string[];
    icon?: string;
    buttons?: AlertButton[];
    esc?: string;
    click?: string;
    enter?: string;
    skipIfAlertDisplayed?: boolean;
    pre?: string;
    hint?: string;
    opaque?: boolean;
    wide?: boolean;
    checkbox?: string;
    view?: FunctionComponent;

    success?: (result: string, checked?: boolean) => void;
    complete?: (result: string, checked?: boolean) => void;
    cancel?: () => void;
}

let alertDisplayed = false;

export class Alert {
    readonly config: AlertConfig;
    private _promise?: Promise<string>;
    private _resolve?: (result: string) => void;
    private _emitter?: TypedEmitter<ModalEmitterEvents>;
    private _result: string | undefined;
    private _checked: boolean | undefined;
    private _visible = false;
    private _el?: HTMLElement;
    private _listeners: Callback[] = [];

    constructor(config: AlertConfig) {
        this.config = config;
    }

    get result(): string | undefined {
        return this._result;
    }

    get visible(): boolean {
        return this._visible;
    }

    show(): void {
        this._emitter = new TypedEmitter<ModalEmitterEvents>();
        const vnode = h(Modal, {
            emitter: this._emitter,
            header: this.config.header,
            body: typeof this.config.body === 'string' ? [this.config.body] : this.config.body,
            opaque: this.config.opaque,
            wide: this.config.wide,
            icon: this.config.icon,
            pre: this.config.pre,
            link: this.config.checkbox,
            hint: this.config.hint,
            checkbox: this.config.checkbox,
            buttons: this.config.buttons ?? [],
            view: this.config.view,

            modalClicked: () => this.modalClicked(),
            buttonClicked: (result) => this.buttonClicked(result),
            checkboxChanged: () => this.checkboxChanged()
        });

        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        this._el = document.createElement('div');
        document.body.appendChild(this._el);
        render(vnode, document.body, this._el);

        this.listenKeys();
        FocusManager.pushModal('alert');

        this._visible = true;
        alertDisplayed = true;
    }

    wait(): Promise<string | undefined> {
        if (!this._visible) {
            return Promise.resolve(this._result);
        }
        if (!this._promise) {
            this._promise = new Promise((resolve) => {
                this._resolve = resolve;
            });
        }
        return this._promise;
    }

    closeWithResult(result: string, immediate?: boolean): void {
        this._visible = false;
        alertDisplayed = false;

        for (const off of this._listeners) {
            off();
        }

        FocusManager.popModal();

        this._result = result;
        if (result) {
            this.config.success?.(result, this._checked);
        } else {
            this.config.cancel?.();
        }
        this.config.complete?.(result, this._checked);

        this._resolve?.(result);

        if (immediate) {
            this.destroy();
        } else {
            this._emitter?.emit('hide');
            setTimeout(() => {
                this.destroy();
            }, Timeouts.HideAlert);
        }
    }

    closeImmediate(): void {
        if (this._el) {
            this.closeWithResult('', true);
        }
    }

    change(config: { header?: string }): void {
        this._emitter?.emit('change-config', config);
    }

    private modalClicked() {
        if (typeof this.config.click === 'string') {
            this.closeWithResult('');
        }
    }

    private buttonClicked(result: string) {
        this.closeWithResult(result);
    }

    private checkboxChanged() {
        this._checked = !this._checked;
    }

    private escPressed() {
        this.closeWithResult(this.config.esc || '');
    }

    private enterPressed(e: Event) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.closeWithResult(this.config.enter || '');
    }

    private listenKeys() {
        if (typeof this.config.esc === 'string') {
            const offKey = KeyHandler.onKey(
                Keys.DOM_VK_ESCAPE,
                () => this.escPressed(),
                undefined,
                'alert'
            );
            this._listeners.push(offKey);
        }

        if (typeof this.config.enter === 'string') {
            const offKey = KeyHandler.onKey(
                Keys.DOM_VK_RETURN,
                (e) => this.enterPressed(e),
                undefined,
                'alert'
            );
            this._listeners.push(offKey);
        }
    }

    private destroy() {
        if (!this._el) {
            return;
        }
        render(null, this._el);
        this._el?.remove();
        this._el = undefined;
    }
}

export const Alerts = {
    get alertDisplayed(): boolean {
        return alertDisplayed;
    },

    buttons: {
        ok: {
            result: 'yes',
            get title() {
                return Locale.alertOk;
            }
        },
        yes: {
            result: 'yes',
            get title() {
                return Locale.alertYes;
            }
        },
        allow: {
            result: 'yes',
            get title() {
                return Locale.alertAllow;
            }
        },
        no: {
            result: '',
            get title() {
                return Locale.alertNo;
            }
        },
        cancel: {
            result: '',
            get title() {
                return Locale.alertCancel;
            }
        },
        deny: {
            result: '',
            get title() {
                return Locale.alertDeny;
            }
        }
    } as Record<string, AlertButton>,

    alert(config: AlertConfig): Alert {
        const alert = new Alert(config);
        if (config.skipIfAlertDisplayed && Alerts.alertDisplayed) {
            return alert;
        }
        alert.show();
        return alert;
    },

    notImplemented(): Alert {
        return this.alert({
            header: Locale.notImplemented,
            body: '',
            icon: 'exclamation-triangle',
            buttons: [this.buttons.ok],
            esc: '',
            click: '',
            enter: ''
        });
    },

    info(config: AlertConfig): Alert {
        return this.alert({
            icon: 'info',
            buttons: [this.buttons.ok],
            esc: '',
            click: '',
            enter: '',
            ...config
        });
    },

    error(config: AlertConfig): Alert {
        return this.alert({
            icon: 'exclamation-circle',
            buttons: [this.buttons.ok],
            esc: '',
            click: '',
            enter: '',
            ...config
        });
    },

    yesno(config: AlertConfig): Alert {
        return this.alert({
            icon: 'question',
            buttons: [this.buttons.yes, this.buttons.no],
            esc: '',
            click: '',
            enter: 'yes',
            ...config
        });
    }
};
