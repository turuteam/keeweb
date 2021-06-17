import { FunctionComponent, h } from 'preact';
import { AutoTypeHintView } from 'views/auxiliary/auto-type-hint-view';
import { Links } from 'const/links';
import { Features } from 'util/features';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { elementBorderSize } from 'util/ui/html-elements';

export const AutoTypeHint: FunctionComponent<{ for: string }> = ({ for: targetId }) => {
    const [visible, setVisible] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

    const isMouseDownOnPopup = useRef(false);
    const inputRef = useRef<HTMLInputElement>();

    useLayoutEffect(() => {
        const input = document.getElementById(targetId);
        if (!(input instanceof HTMLInputElement)) {
            return;
        }

        inputRef.current = input;

        const inputFocus = () => {
            if (!input.offsetParent) {
                return;
            }

            const rect = input.getBoundingClientRect();
            const offsetRect = input.offsetParent.getBoundingClientRect();
            const borderWidth = elementBorderSize(input);

            setPos({
                top: rect.bottom - offsetRect.top + borderWidth,
                left: rect.left - offsetRect.left,
                width: rect.width
            });
            setVisible(true);
        };

        const inputBlur = () => {
            if (isMouseDownOnPopup.current) {
                return;
            }
            setVisible(false);
        };

        input.addEventListener('focus', inputFocus);
        input.addEventListener('blur', inputBlur);

        return () => {
            input.removeEventListener('focus', inputFocus);
            input.removeEventListener('blur', inputBlur);
        };
    }, []);

    const itemClicked = (text: string) => {
        if (text[0] !== '{') {
            text = text.split(' ')[0];
        }

        const input = inputRef.current;
        if (!input) {
            return;
        }

        const pos = input.selectionEnd || input.value.length;
        input.value = input.value.substr(0, pos) + text + input.value.substr(pos);
        input.selectionStart = input.selectionEnd = pos + text.length;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const onMouseDown = () => {
        isMouseDownOnPopup.current = true;
    };

    const onMouseUp = () => {
        isMouseDownOnPopup.current = false;
        inputRef.current?.focus();
    };

    if (!visible) {
        return null;
    }

    return h(AutoTypeHintView, {
        ...pos,
        link: Links.AutoType,
        cmd: Features.isMac ? 'command' : 'ctrl',
        hasCtrl: Features.isMac,

        itemClicked,
        onMouseDown,
        onMouseUp
    });
};
