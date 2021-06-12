import { FunctionComponent, h } from 'preact';
import { AppContextMenuView } from 'views/menu/app-context-menu-view';
import { useKey, useModal, useModelField, useModelWatcher } from 'util/ui/hooks';
import { ContextMenu } from 'models/menu/context-menu';
import { Keys } from 'const/keys';
import { useEffect } from 'preact/hooks';
import { DropdownState } from 'models/ui/dropdown-state';

export const AppContextMenuContainer: FunctionComponent = () => {
    const dropdownType = useModelField(DropdownState, 'type');

    if (dropdownType !== 'menu') {
        return null;
    }

    return h(AppContextMenu, null);
};

export const AppContextMenu: FunctionComponent = () => {
    useModal('dropdown');
    useModelWatcher(ContextMenu);

    useKey(Keys.DOM_VK_UP, () => ContextMenu.selectPrevious(), undefined, 'dropdown');
    useKey(Keys.DOM_VK_DOWN, () => ContextMenu.selectNext(), undefined, 'dropdown');
    useKey(Keys.DOM_VK_ESCAPE, () => ContextMenu.hide(), undefined, 'dropdown');
    useKey(Keys.DOM_VK_ENTER, () => ContextMenu.closeWithSelectedResult(), undefined, 'dropdown');
    useKey(Keys.DOM_VK_RETURN, () => ContextMenu.closeWithSelectedResult(), undefined, 'dropdown');

    useEffect(() => {
        const hideMenu = (e: KeyboardEvent) => {
            if (
                ![
                    Keys.DOM_VK_UP,
                    Keys.DOM_VK_DOWN,
                    Keys.DOM_VK_RETURN,
                    Keys.DOM_VK_ESCAPE,
                    Keys.DOM_VK_RETURN
                ].includes(e.which)
            ) {
                ContextMenu.hide();
            }
        };
        document.addEventListener('keydown', hideMenu);
        return () => document.removeEventListener('keydown', hideMenu);
    }, []);

    return h(AppContextMenuView, {
        pos: ContextMenu.pos,
        items: ContextMenu.items,
        selectedItem: ContextMenu.selectedItem
    });
};
