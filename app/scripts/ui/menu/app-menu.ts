import { FunctionComponent, h } from 'preact';
import { Workspace } from 'models/workspace';
import { AppMenuView } from 'views/menu/app-menu-view';
import { useModelField } from 'util/ui/hooks';

export const AppMenu: FunctionComponent = () => {
    const sections = useModelField(Workspace.menu, 'sections');

    return h(AppMenuView, {
        sections
    });
};
