import { AppSettings, AppSettingsFieldName } from 'models/app-settings';
import { Ref, useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { NonFunctionPropertyNames, Position } from 'util/types';
import { ListenerSignature, Model } from 'util/model';
import { KeyHandler } from 'comp/browser/key-handler';
import { Keys } from 'const/keys';
import { Events, GlobalEventSpec } from 'util/events';
import { FocusManager } from 'comp/app/focus-manager';

export function useModelField<
    ModelEventsType extends ListenerSignature<ModelEventsType>,
    ModelType extends Model<ModelEventsType>,
    Field extends NonFunctionPropertyNames<ModelType>
>(model: ModelType, field: Field): ModelType[Field] {
    const [value, setValue] = useState(model[field]);

    useEffect(() => {
        model.onChange(field, setValue);
        return () => model.offChange(field, setValue);
    }, [model]);

    return value;
}

export function useAppSetting<Field extends AppSettingsFieldName>(
    field: Field
): typeof AppSettings[Field] {
    return useModelField(AppSettings, field);
}

export function useModelWatcher<
    ModelEventsType extends ListenerSignature<ModelEventsType>,
    ModelType extends Model<ModelEventsType>
>(model: ModelType): void {
    const [, setState] = useState({});

    useEffect(() => {
        const refresh = () => setState({});
        (model as Model).on('change', refresh);
        return () => (model as Model).off('change', refresh);
    }, [model]);
}

export function useEvent<Event extends keyof GlobalEventSpec>(
    event: Event,
    handler: GlobalEventSpec[Event]
): void {
    useEffect(() => {
        Events.on(event, handler);
        return () => Events.off(event, handler);
    }, []);
}

export function useKey(
    key: Keys,
    handler: (e: KeyboardEvent) => void,
    shortcut?: number,
    modal?: string,
    noPrevent?: boolean
): void {
    useEffect(() => {
        return KeyHandler.onKey(key, handler, shortcut, modal, noPrevent);
    }, []);
}

export function useModal(name: string): void {
    useEffect(() => {
        FocusManager.pushModal(name);
        return () => FocusManager.popModal();
    }, []);
}

export function usePositionable(
    pos: Position,
    el: Ref<HTMLDivElement>
): { top: number; left: number } {
    const [top, setTop] = useState(pos.top ?? -100000);
    const [left, setLeft] = useState(pos.left ?? -100000);

    useLayoutEffect(() => {
        if ((pos.top === undefined || pos.left === undefined) && el.current) {
            const rect = el.current.getBoundingClientRect();
            if (pos.top === undefined && pos.bottom) {
                setTop(pos.bottom - rect.height);
            }
            if (pos.left === undefined && pos.right) {
                setLeft(pos.right - rect.width);
            }
        }
    }, [pos]);

    return { top, left };
}
