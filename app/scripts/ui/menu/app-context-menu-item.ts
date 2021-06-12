import { FunctionComponent, h } from 'preact';
import { AppContextMenuItemView } from 'views/menu/app-context-menu-item-view';
import { ContextMenu, ContextMenuItem } from 'models/context-menu';

export const AppContextMenuItem: FunctionComponent<{ item: ContextMenuItem; active: boolean }> = ({
    item,
    active
}) => {
    const onClick = () => {
        ContextMenu.closeWithResult(item);
    };

    return h(AppContextMenuItemView, {
        active,
        icon: item.icon,
        title: item.title,
        hint: item.hint,

        onClick
    });
};
