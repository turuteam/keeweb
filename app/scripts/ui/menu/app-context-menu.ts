import { FunctionComponent, h } from 'preact';
import { AppContextMenuView } from 'views/menu/app-context-menu-view';
import { useKey, useModal, useModelWatcher } from 'util/ui/hooks';
import { ContextMenu } from 'models/context-menu';
import { Keys } from 'const/keys';

export const AppContextMenu: FunctionComponent = () => {
    useModal('dropdown');
    useModelWatcher(ContextMenu);

    useKey(Keys.DOM_VK_UP, () => ContextMenu.selectPrevious(), undefined, 'dropdown');
    useKey(Keys.DOM_VK_DOWN, () => ContextMenu.selectNext(), undefined, 'dropdown');
    useKey(Keys.DOM_VK_ESCAPE, () => ContextMenu.hide(), undefined, 'dropdown');
    useKey(Keys.DOM_VK_ENTER, () => ContextMenu.closeWithSelectedResult(), undefined, 'dropdown');
    useKey(Keys.DOM_VK_RETURN, () => ContextMenu.closeWithSelectedResult(), undefined, 'dropdown');

    const bodyClicked = () => ContextMenu.hide();

    return h(AppContextMenuView, {
        pos: ContextMenu.pos,
        items: ContextMenu.items,
        selectedItem: ContextMenu.selectedItem,

        bodyClicked
    });
};
