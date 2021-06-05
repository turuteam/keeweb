import { FunctionComponent } from 'preact';
import { classes } from 'util/ui/classes';
import { MenuOption } from 'models/menu/menu-option';
import { Locale } from 'util/locale';
import { useState } from 'preact/hooks';
import { MenuItem } from 'models/menu/menu-item';
import { AppMenuItem } from 'ui/menu/app-menu-item';
import { withoutPropagation } from 'util/ui/events';

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
    expanded?: boolean;
    items?: MenuItem[];

    itemClicked?: () => void;
    itemDblClicked?: () => void;
    optionClicked?: (option: MenuOption) => void;
    actionClicked?: () => void;
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
    expanded,
    items,

    itemClicked,
    itemDblClicked,
    optionClicked,
    actionClicked
}) => {
    const [hover, setHover] = useState(false);

    return (
        <div
            class={classes({
                'menu__item': true,
                'menu__item--active': active,
                'menu__item--disabled': disabled,
                'menu__item--with-options': !!options?.length,
                'menu__item--hover': hover,
                'menu__item--collapsed': !expanded,
                ...(cls ? { [cls]: true } : null)
            })}
            onMouseOver={withoutPropagation(setHover, true)}
            onMouseOut={withoutPropagation(setHover, false)}
            onClick={withoutPropagation(itemClicked)}
            onDblClick={withoutPropagation(itemDblClicked)}
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
                                onClick={withoutPropagation(optionClicked, opt)}
                            >
                                {opt.title}
                            </div>
                        ))}
                    </div>
                ) : null}
                {editable ? (
                    <i
                        class="menu__item-edit fa fa-cog"
                        onClick={withoutPropagation(actionClicked)}
                    />
                ) : null}
                {isTrash ? (
                    <i
                        class="menu__item-empty-trash fa fa-minus-circle"
                        onClick={withoutPropagation(actionClicked)}
                    >
                        <kw-tip text={Locale.menuEmptyTrash} placement="right" />
                    </i>
                ) : null}
            </div>
            {items
                ? items
                      .filter((item) => item.visible)
                      .map((item) => <AppMenuItem item={item} key={item.id} />)
                : null}
        </div>
    );
};
