import { TypedEmitter } from 'tiny-typed-emitter';
import { NonFunctionPropertyNames } from './types';

export type ListenerSignature<EventSpec> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [EventName in keyof EventSpec]: (...args: any[]) => any;
};

export interface DefaultModelEvents {
    'change': () => void;
}

interface ModelTypedEmitter extends TypedEmitter {
    changePending?: boolean;
    batchSet?: boolean;
    silent?: boolean;
}

const DefaultMaxListeners = 100;

const SymbolEmitter = Symbol('emitter');

function emitPropChange(target: Model, prop: string, value: unknown, prevValue: unknown) {
    const emitter = target[SymbolEmitter] as ModelTypedEmitter;
    if (emitter && !prop.startsWith('_')) {
        if (!emitter.silent) {
            emitter.emit(`change:${prop}`, value, prevValue);
            if (emitter.batchSet) {
                emitter.changePending = true;
            } else {
                emitter.emit(`change`);
            }
        }
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const ProxyDef: ProxyHandler<any> = {
    deleteProperty(target: any, prop: string | symbol): boolean {
        const prevValue = target[prop];
        const value = undefined;
        if (prevValue !== value) {
            delete target[prop];
            if (typeof prop === 'string') {
                emitPropChange(target, prop, value, prevValue);
            }
        }
        return true;
    },

    set(target: any, prop: string | symbol, value: unknown): boolean {
        const prevValue = target[prop];
        if (prevValue !== value) {
            target[prop] = value;
            if (typeof prop === 'string') {
                emitPropChange(target, prop, value, prevValue);
            }
        }
        return true;
    }
};

/* eslint-enable */

export class Model<EventSpec extends ListenerSignature<EventSpec> = DefaultModelEvents> {
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return new Proxy(this, ProxyDef);
    }

    private [SymbolEmitter]: TypedEmitter<EventSpec>;

    private emitter(): TypedEmitter<EventSpec> {
        let emitter = this[SymbolEmitter];
        if (!emitter) {
            emitter = new TypedEmitter<EventSpec>();
            Object.defineProperty(this, SymbolEmitter, {
                enumerable: false,
                value: emitter
            });
            emitter.setMaxListeners(DefaultMaxListeners);
        }
        return emitter;
    }

    protected emit<EventName extends keyof EventSpec>(
        event: EventName,
        ...args: Parameters<EventSpec[EventName]>
    ): boolean {
        return this.emitter().emit(event, ...args);
    }

    once<EventName extends keyof EventSpec>(
        event: EventName,
        listener: EventSpec[EventName]
    ): this {
        this.emitter().once(event, listener);
        return this;
    }

    on<EventName extends keyof EventSpec>(event: EventName, listener: EventSpec[EventName]): this {
        this.emitter().on(event, listener);
        return this;
    }

    off<EventName extends keyof EventSpec>(event: EventName, listener: EventSpec[EventName]): this {
        this.emitter().off(event, listener);
        return this;
    }

    onChange<PropName extends NonFunctionPropertyNames<this>>(
        prop: PropName,
        listener: (value: this[PropName], prevValue: this[PropName]) => void
    ): this {
        const emitter = this.emitter() as TypedEmitter;
        emitter.on(`change:${prop}`, listener);
        return this;
    }

    offChange<PropName extends NonFunctionPropertyNames<this>>(
        prop: PropName,
        listener: (value: this[PropName], prevValue: this[PropName]) => void
    ): this {
        const emitter = this.emitter() as TypedEmitter;
        emitter.off(`change:${prop}`, listener);
        return this;
    }

    batchSet(setter: () => void): void {
        const emitter = this[SymbolEmitter] as ModelTypedEmitter;
        const isNested = emitter?.batchSet;

        if (emitter) {
            emitter.batchSet = true;
        }

        try {
            setter();
        } finally {
            if (emitter && !isNested) {
                emitter.batchSet = false;
                if (emitter.changePending) {
                    emitter.changePending = false;
                    emitter.emit('change');
                }
            }
        }
    }

    reset(): void {
        const defaults = new (this.constructor as typeof Model)();
        const props = new Map<string, unknown>();
        for (const key of Object.keys(this)) {
            props.set(key, undefined);
        }
        for (const [key, value] of Object.entries(defaults)) {
            props.set(key, value);
        }
        this.batchSet(() => {
            for (const [key, value] of props) {
                if (value === undefined) {
                    delete (this as Record<string, unknown>)[key];
                } else {
                    (this as Record<string, unknown>)[key] = value;
                }
            }
        });
    }
}
