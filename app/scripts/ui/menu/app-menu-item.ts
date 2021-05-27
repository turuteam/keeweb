import { FunctionComponent, h } from 'preact';
import { AppMenuItemView } from 'views/menu/app-menu-item-view';
import { MenuItem } from 'models/menu/menu-item';
import { useEffect, useState } from 'preact/hooks';
import { Locale } from 'util/locale';
import { MenuOption } from 'models/menu/menu-option';

export const AppMenuItem: FunctionComponent<{ item: MenuItem }> = ({ item }) => {
    const [, refresh] = useState({});

    useEffect(() => {
        const onChange = () => refresh({});
        item.on('change', onChange);
        return () => item.off('change', onChange);
    }, []);

    const itemClicked = () => {
        // TODO
    };

    const optionClicked = (option: MenuOption) => {
        // TODO
    };

    return h(AppMenuItemView, {
        title: item.title || Locale.noTitle,
        active: item.active,
        disabled: item.disabled,
        options: item.options,
        cls: item.cls,
        drag: item.drag,
        editable: item.editable,
        icon: item.icon,
        iconCls: item.iconCls,
        customIcon: item.customIcon,
        isTrash: item.filterKey === 'trash',
        collapsible: item.collapsible,
        items: item.items,

        itemClicked,
        optionClicked
    });
};
