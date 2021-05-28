import { FunctionComponent } from 'preact';
import { MenuItem } from 'models/menu/menu-item';
import { AppMenuItem } from 'ui/menu/app-menu-item';
import { Scrollable } from 'views/components/scrollable';
import { classes } from 'util/ui/classes';
import { DragHandle } from 'views/components/drag-handle';
import { useRef } from 'preact/hooks';

export const AppMenuSectionView: FunctionComponent<{
    id: string;
    scrollable: boolean;
    grow: boolean;
    drag: boolean;
    items: MenuItem[];
    height?: number;
}> = ({ id, scrollable, grow, drag, items, height }) => {
    const menuRef = useRef<HTMLDivElement>();
    const menuItems = items.map((item) => <AppMenuItem item={item} key={item.id} />);

    return (
        <>
            <div
                class={classes({
                    'menu__section': true,
                    'menu__section--scrollable': scrollable,
                    'menu__section--grow': grow,
                    'menu__section--drag': drag
                })}
                style={{ height }}
                ref={menuRef}
            >
                {scrollable ? <Scrollable>{menuItems}</Scrollable> : menuItems}
            </div>
            {drag ? (
                <div class="menu__drag-section">
                    <DragHandle
                        target={menuRef}
                        coord="y"
                        name={`menu-section:${id}`}
                        min={55}
                        max={1100}
                    />
                </div>
            ) : null}
        </>
    );
};
