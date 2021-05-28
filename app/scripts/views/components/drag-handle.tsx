import { FunctionComponent } from 'preact';
import { Ref, useRef, useState } from 'preact/hooks';
import { classes } from 'util/ui/classes';
import { Events } from 'util/events';
import { minmax } from 'util/fn';

export const DragHandle: FunctionComponent<{
    target: Ref<HTMLDivElement>;
    coord: 'x' | 'y';
    name: string;
    min: number;
    max: number;
}> = ({ target, coord, name, min, max }) => {
    const mouseDownTime = useRef(-1);
    const mouseDownCount = useRef(0);
    const el = useRef<HTMLDivElement>();

    const [dragging, setDragging] = useState(false);

    const mouseDown = (e: MouseEvent) => {
        const targetElement = target.current;
        if (e.button !== 0 || !targetElement) {
            return;
        }

        const offsetEventProp = coord === 'x' ? 'pageX' : 'pageY';
        const elementSizeProp = coord === 'x' ? 'offsetWidth' : 'offsetHeight';
        const styleSizeProp = coord === 'x' ? 'width' : 'height';

        const now = Date.now();
        if (now - mouseDownTime.current < 500) {
            const currentMouseDown = ++mouseDownCount.current;
            if (currentMouseDown === 2) {
                targetElement.style.removeProperty(styleSizeProp);
                Events.emit('drag-handle-set', name, null);
                return;
            }
        } else {
            mouseDownTime.current = now;
            mouseDownCount.current = 1;
        }

        const targetStyle = getComputedStyle(targetElement);
        const padding =
            coord === 'x'
                ? (parseInt(targetStyle.paddingLeft, 10) || 0) +
                  (parseInt(targetStyle.paddingRight, 10) || 0)
                : (parseInt(targetStyle.paddingTop, 10) || 0) +
                  (parseInt(targetStyle.paddingBottom, 10) || 0);

        const initialSize = targetElement[elementSizeProp] - padding;
        const initialOffset = e[offsetEventProp];
        const { cursor } = getComputedStyle(el.current);

        const dragMask = document.createElement('div');
        dragMask.classList.add('drag-mask');
        dragMask.style.cursor = cursor;

        const complete = () => {
            dragMask.remove();

            const size = Math.round(targetElement[elementSizeProp] - padding);
            Events.emit('drag-handle-set', name, size);
        };

        const mouseMove = (e: MouseEvent) => {
            const offset = e[offsetEventProp] - initialOffset;
            const size = minmax(initialSize + offset, min, max);
            targetElement.style[styleSizeProp] = `${size}px`;

            const buttonPressed = !!e.buttons;
            if (!buttonPressed) {
                complete();
            }
        };

        dragMask.addEventListener('mousemove', mouseMove);
        dragMask.addEventListener('mouseup', complete);

        document.body.appendChild(dragMask);

        setDragging(true);
    };

    return (
        <div
            class={classes({
                'drag-handle__inner': true,
                [`drag-handle__inner--${coord}`]: true,
                dragging
            })}
            ref={el}
            onMouseDown={mouseDown}
        />
    );
};
