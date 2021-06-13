import { FunctionComponent, h } from 'preact';
import { GroupPanelView } from 'views/panel/group-panel-view';
import { Workspace } from 'models/workspace';

export const GroupPanel: FunctionComponent = () => {
    const backClicked = () => Workspace.showList();

    return h(GroupPanelView, {
        backClicked
    });
};
