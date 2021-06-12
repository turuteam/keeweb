import { FunctionComponent, h } from 'preact';
import { AppContextMenuView } from 'views/menu/app-context-menu-view';
import { useKey, useModal, useModelWatcher } from 'util/ui/hooks';
import { ContextMenu } from 'models/context-menu';
import { Keys } from 'const/keys';
import { useEffect } from 'preact/hooks';

export const AppContextMenuContainer: FunctionComponent = () => {
    useModelWatcher(ContextMenu);

    if (!ContextMenu.id) {
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

    const bodyClicked = () => ContextMenu.hide();

    return h(AppContextMenuView, {
        pos: ContextMenu.pos,
        items: ContextMenu.items,
        selectedItem: ContextMenu.selectedItem,

        bodyClicked
    });
};
