import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';

export const AutoTypeHintView: FunctionComponent<{
    top: number;
    left: number;
    width: number;
    link: string;
    cmd: string;
    hasCtrl: boolean;

    itemClicked: (text: string) => void;
    onMouseDown: () => void;
    onMouseUp: () => void;
}> = ({ top, left, width, link, cmd, hasCtrl, itemClicked, onMouseDown, onMouseUp }) => {
    const onClick = (e: Event) => {
        if (!(e.target instanceof HTMLElement)) {
            return;
        }
        const link = e.target.closest('a');
        if (!link || link.href) {
            return;
        }
        itemClicked(link.innerText);
    };

    return (
        <div
            class="auto-type-hint"
            style={{ top, left, width }}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onClick={onClick}
        >
            <div class="auto-type-hint__body">
                <a
                    href={link}
                    class="auto-type-hint__link-details"
                    target="_blank"
                    rel="noreferrer"
                >
                    {Locale.autoTypeLink}
                </a>
                <div class="auto-type-hint__block">
                    <div>{Locale.autoTypeEntryFields}:</div>
                    <a>{'{TITLE}'}</a>
                    <a>{'{USERNAME}'}</a>
                    <a>{'{URL}'}</a>
                    <a>{'{PASSWORD}'}</a>
                    <a>{'{NOTES}'}</a>
                    <a>{'{GROUP}'}</a>
                    <a>{'{TOTP}'}</a>
                    <a>{'{S:Custom Field Name}'}</a>
                </div>
                <div class="auto-type-hint__block">
                    <div>{Locale.autoTypeModifiers}:</div>
                    <a>+ (shift)</a>
                    <a>% (alt)</a>
                    <a>^ ({cmd})</a>
                    {hasCtrl ? <a>^^ (ctrl)</a> : null}
                </div>
                <div class="auto-type-hint__block">
                    <div>{Locale.autoTypeKeys}:</div>
                    <a>{'{TAB}'}</a>
                    <a>{'{ENTER}'}</a>
                    <a>{'{SPACE}'}</a>
                    <a>{'{UP}'}</a>
                    <a>{'{DOWN}'}</a>
                    <a>{'{LEFT}'}</a>
                    <a>{'{RIGHT}'}</a>
                    <a>{'{HOME}'}</a>
                    <a>{'{END}'}</a>
                    <a>{'{+}'}</a>
                    <a>{'{%}'}</a>
                    <a>{'{^}'}</a>
                    <a>{'{~}'}</a>
                    <a>{'{(}'}</a>
                    <a>{'{)}'}</a>
                    <a>{'{[}'}</a>
                    <a>{'{]}'}</a>
                    <a>{'{{}'}</a>
                    <a>{'{}}'}</a>
                </div>
            </div>
        </div>
    );
};
