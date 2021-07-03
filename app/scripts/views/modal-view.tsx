import { Fragment, FunctionComponent } from 'preact';
import { classes } from 'util/ui/classes';
import { withoutPropagation } from 'util/ui/events';

export interface ModalViewButton {
    title: string;
    result: string;
    error?: boolean;
    silent?: boolean;
}

export interface ModalViewProps {
    header: string;
    body: string[];
    opaque?: boolean;
    wide?: boolean;
    icon?: string;
    pre?: string;
    link?: string;
    hint?: string;
    checkbox?: string;
    buttons: ModalViewButton[];
    hidden?: boolean;
    view?: FunctionComponent;

    modalClicked: () => void;
    buttonClicked: (result: string) => void;
    checkboxChanged: () => void;
}

export const ModalView: FunctionComponent<ModalViewProps> = ({
    hidden,
    header,
    body,
    opaque,
    wide,
    icon,
    pre,
    link,
    hint,
    checkbox,
    buttons,
    view: InnerView,

    modalClicked,
    buttonClicked,
    checkboxChanged
}) => {
    return (
        <div
            class={classes({
                modal: true,
                'modal--hidden': hidden,
                'modal--opaque': opaque,
                'modal--wide': wide
            })}
            onClick={modalClicked}
        >
            <div class="modal__content">
                {icon ? <i class={`modal__icon fa fa-${icon}`} /> : null}
                <div class="modal__header">{header}</div>
                <div class="modal__body">
                    {body.map((item, ix) => (
                        <Fragment key={ix}>
                            {ix ? <br /> : null}
                            {item}
                        </Fragment>
                    ))}
                    {pre ? <pre class="modal__pre">{pre}</pre> : null}
                    {link ? (
                        <a href={link} class="modal__link" target="_blank" rel="noreferrer">
                            {link}
                        </a>
                    ) : null}
                    {hint ? <p class="muted-color">{hint}</p> : null}
                    {checkbox ? (
                        <div class="modal__check-wrap">
                            <input type="checkbox" id="modal__check" onClick={checkboxChanged} />
                            <label for="modal__check">{checkbox}</label>
                        </div>
                    ) : null}
                    {InnerView ? <InnerView /> : null}
                </div>
                <div class="modal__buttons">
                    {buttons.map((btn) => (
                        <button
                            key={btn.title}
                            class={classes({
                                'btn-error': btn.error || !btn.result,
                                'btn-silent': btn.silent
                            })}
                            onClick={withoutPropagation(buttonClicked, btn.result)}
                            data-result={btn.result}
                        >
                            {btn.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
