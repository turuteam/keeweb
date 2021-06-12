import { FunctionComponent, h } from 'preact';
import { AppContextMenu } from './app-context-menu';
import { useModelWatcher } from 'util/ui/hooks';
import { ContextMenu } from 'models/context-menu';

export const AppContextMenuContainer: FunctionComponent = () => {
    useModelWatcher(ContextMenu);

    if (!ContextMenu.id) {
        return null;
    }

    return h(AppContextMenu, null);
};
