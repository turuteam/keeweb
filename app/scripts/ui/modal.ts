import { h, FunctionComponent } from 'preact';
import { ModalView, ModalViewProps } from 'views/modal-view';
import { TypedEmitter } from 'tiny-typed-emitter';
import { useEffect, useState } from 'preact/hooks';

export interface ModalEmitterEvents {
    'change-config': (config: Partial<ModalViewProps>) => void;
    'hide': () => void;
}

export interface ModalProps extends ModalViewProps {
    emitter: TypedEmitter<ModalEmitterEvents>;
}

export const Modal: FunctionComponent<ModalProps> = (props) => {
    const [stateProps, setStateProps] = useState(props);
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        setHidden(false);
    }, []);

    const actualProps = Object.assign({}, stateProps);
    actualProps.hidden = hidden;

    props.emitter.on('change-config', (config) => {
        const newProps = Object.assign({}, props, config);
        setStateProps(newProps);
    });
    props.emitter.on('hide', () => {
        setHidden(true);
    });

    return h(ModalView, actualProps);
};
