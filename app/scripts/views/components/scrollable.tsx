import { debounce } from 'lodash';
import { FunctionComponent } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Features } from 'util/features';
import { baron } from 'util/ui/baron';
import { classes } from 'util/ui/classes';
import { Timeouts } from 'const/timeouts';

const Scrollable: FunctionComponent = ({ children }) => {
    const scroller = useRef<HTMLDivElement>();
    const bar = useRef<HTMLDivElement>();
    const barWrapper = useRef<HTMLDivElement>();

    const [barWrapperInvisible, setBarWrapperInvisible] = useState(false);

    useLayoutEffect(() => {
        if (!scroller.current.parentElement) {
            return;
        }

        const scroll = baron({
            root: scroller.current.parentElement,
            scroller: scroller.current,
            bar: bar.current
        });

        const updateInvisible = () => {
            const barHeight = Math.round(bar.current.clientHeight);
            const barWrapperHeight = Math.round(barWrapper.current.clientHeight);
            setBarWrapperInvisible(barHeight >= barWrapperHeight);
        };

        const updateScroll = () => {
            scroll.update();
            updateInvisible();
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        const updateScrollDebounced = debounce(updateScroll, Timeouts.WindowResizeUpdateDebounce);

        updateInvisible();

        window.addEventListener('resize', updateScrollDebounced);

        return () => {
            scroll.dispose();
            window.removeEventListener('resize', updateScrollDebounced);
        };
    }, []);

    return (
        <>
            <div class="scroller" ref={scroller}>
                {children}
            </div>
            <div
                class={classes({
                    invisible: barWrapperInvisible,
                    'scroller__bar-wrapper': true
                })}
                ref={barWrapper}
            >
                <div class="scroller__bar" ref={bar} />
            </div>
        </>
    );
};

const Empty: FunctionComponent = ({ children }) => <>{children}</>;

const ScrollableComponent = Features.isMobile ? Empty : Scrollable;

export { ScrollableComponent as Scrollable };
