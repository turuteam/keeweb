import { FunctionComponent, h } from 'preact';
import { AppMenuItemView } from 'views/menu/app-menu-item-view';
import { MenuItem } from 'models/menu/menu-item';
import { useEffect } from 'preact/hooks';
import { Locale } from 'util/locale';
import { MenuOption } from 'models/menu/menu-option';
import { Workspace } from 'models/workspace';
import { KeyHandler } from 'comp/browser/key-handler';
import { Callback } from 'util/types';
import { Keys } from 'const/keys';
import { Alerts } from 'comp/ui/alerts';
import { useModelWatcher } from 'util/ui/hooks';

export const AppMenuItem: FunctionComponent<{ item: MenuItem }> = ({ item }) => {
    useModelWatcher(item);

    useEffect(() => {
        const offs: Callback[] = [];
        if (item.shortcut) {
            offs.push(KeyHandler.onKey(item.shortcut, selectItem, KeyHandler.SHORTCUT_OPT));
            if (item.shortcut !== Keys.DOM_VK_C) {
                offs.push(KeyHandler.onKey(item.shortcut, selectItem, KeyHandler.SHORTCUT_ACTION));
            }
            return () => offs.forEach((off) => off());
        }
    }, []);

    const selectItem = () => {
        if (item.active) {
            return;
        }
        if (item.disabled) {
            if (item.disabledAlert) {
                Alerts.info(item.disabledAlert);
            }
        } else {
            Workspace.menu.select({ item });
        }
    };

    const itemClicked = () => {
        selectItem();
    };

    const itemDblClicked = () => {
        item.toggleExpanded();
    };

    const optionClicked = (option: MenuOption) => {
        Workspace.menu.select({ item, option });
    };

    const actionClicked = () => {
        if (item.filterKey === 'trash') {
            askUserAndEmptyTrash();
        } else {
            Alerts.notImplemented(); // TODO: item editing
        }
    };

    const askUserAndEmptyTrash = () => {
        Alerts.yesno({
            header: Locale.menuEmptyTrashAlert,
            body: Locale.menuEmptyTrashAlertBody,
            icon: 'minus-circle',
            success() {
                Workspace.emptyTrash();
            }
        });
    };

    return h(AppMenuItemView, {
        title: item.title || `(${Locale.noTitle})`,
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
        expanded: item.expanded,
        items: item.items,

        itemClicked,
        itemDblClicked,
        optionClicked,
        actionClicked
    });
};
