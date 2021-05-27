import { FunctionComponent } from 'preact';
import { classes } from 'util/ui/classes';
import { MenuOption } from 'models/menu/menu-option';
import { Locale } from 'util/locale';
import { useState } from 'preact/hooks';
import { MenuItem } from 'models/menu/menu-item';
import { AppMenuItem } from 'ui/menu/app-menu-item';

export const AppMenuItemView: FunctionComponent<{
    title: string;
    active?: boolean;
    disabled?: boolean;
    options?: MenuOption[];
    cls?: string;
    drag?: boolean;
    editable?: boolean;
    icon?: string;
    iconCls?: string;
    customIcon?: string;
    isTrash?: boolean;
    collapsible?: boolean;
    items?: MenuItem[];

    itemClicked: () => void;
    optionClicked: (option: MenuOption) => void;
}> = ({
    title,
    active,
    disabled,
    options,
    cls,
    drag,
    editable,
    icon,
    iconCls,
    customIcon,
    isTrash,
    collapsible,
    items,

    itemClicked,
    optionClicked
}) => {
    const [hover, setHover] = useState(false);

    const mouseOver = (e: Event) => {
        e.stopPropagation();
        setHover(true);
    };

    const mouseOut = (e: Event) => {
        e.stopPropagation();
        setHover(false);
    };

    const optionClickedStopPropagation = (e: Event, option: MenuOption) => {
        e.stopPropagation();
        optionClicked(option);
    };

    return (
        <div
            class={classes({
                'menu__item': true,
                'menu__item--active': active,
                'menu__item--disabled': disabled,
                'menu__item--with-options': !!options?.length,
                'menu__item--hover': hover,
                ...(cls ? { [cls]: true } : null)
            })}
            onMouseOver={(e) => mouseOver(e)}
            onMouseOut={(e) => mouseOut(e)}
            onClick={itemClicked}
        >
            {collapsible ? (
                <i class="menu__item-collapse fa fa-ellipsis-v muted-color">
                    <kw-tip text={Locale.menuItemCollapsed} />
                </i>
            ) : null}
            <div class="menu__item-body" draggable={drag}>
                {drag ? <div class="menu__item-drag-top" /> : null}
                {customIcon ? (
                    <img src={customIcon} class="menu__item-icon menu__item-icon--image" />
                ) : (
                    <i
                        class={classes({
                            'menu__item-icon': true,
                            'fa': true,
                            ...(icon
                                ? { [`fa-${icon}`]: true }
                                : { 'menu__item-icon--no-icon': true }),
                            ...(iconCls ? { [iconCls]: true } : null)
                        })}
                    />
                )}
                <span class="menu__item-title">{title}</span>
                {options?.length ? (
                    <div class="menu__item-options">
                        {options.map((opt) => (
                            <div
                                class={`menu__item-option ${opt.cls || ''}`}
                                key={opt.value}
                                onClick={(e) => optionClickedStopPropagation(e, opt)}
                            >
                                {opt.title}
                            </div>
                        ))}
                    </div>
                ) : null}
                {editable ? <i class="menu__item-edit fa fa-cog" /> : null}
                {isTrash ? (
                    <i class="menu__item-empty-trash fa fa-minus-circle" tip-placement="right">
                        <kw-tip text={Locale.menuEmptyTrash} />
                    </i>
                ) : null}
            </div>
            {items ? items.map((item) => <AppMenuItem item={item} key={item.id} />) : null}
        </div>
    );
};
