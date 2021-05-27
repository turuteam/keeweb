import { FunctionComponent } from 'preact';
import { MenuItem } from 'models/menu/menu-item';
import { AppMenuItem } from 'ui/menu/app-menu-item';
import { classes } from 'util/ui/classes';

export const AppMenuSectionView: FunctionComponent<{
    scrollable: boolean;
    grow: boolean;
    drag: boolean;
    items: MenuItem[];
}> = ({ scrollable, grow, drag, items }) => {
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
            >
                {scrollable ? (
                    <>
                        <div class="scroller">{menuItems}</div>
                        <div class="scroller__bar-wrapper">
                            <div class="scroller__bar" />
                        </div>
                    </>
                ) : (
                    <>{menuItems}</>
                )}
            </div>
            {drag ? <div class="menu__drag-section" /> : null}
        </>
    );
};
