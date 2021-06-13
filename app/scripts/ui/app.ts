import 'web-components/kw-tip';

import { FunctionComponent, h } from 'preact';
import { AppView } from 'views/app-view';
import { RuntimeInfo } from 'const/runtime-info';
import { AppSettings } from 'models/app-settings';
import { Features } from 'util/features';
import { Workspace } from 'models/workspace';
import { useEffect } from 'preact/hooks';
import { Events } from 'util/events';
import { useAppSetting, useModelField } from 'util/ui/hooks';

export const App: FunctionComponent = () => {
    const mode = useModelField(Workspace, 'mode');

    const menuWidth = useAppSetting('menuViewWidth');
    const listWidth = useAppSetting('listViewWidth');
    const tableView = useAppSetting('tableView');

    useEffect(() => {
        const dragHandleSet = (name: string, size: number | null) => {
            switch (name) {
                case 'menu':
                    AppSettings.menuViewWidth = size;
                    break;
                case 'list':
                    AppSettings.listViewWidth = size;
                    break;
            }
        };
        Events.on('drag-handle-set', dragHandleSet);
        return () => Events.off('drag-handle-set', dragHandleSet);
    }, []);

    const menuVisible = mode === 'list' || mode === 'settings' || mode === 'panel';
    const listVisible = mode === 'list';
    const settingsVisible = mode === 'settings';
    const panelVisible = mode === 'panel';
    const openVisible = mode === 'open';

    return h(AppView, {
        beta: RuntimeInfo.beta,
        customTitlebar: Features.renderCustomTitleBar,
        titlebarStyle: AppSettings.titlebarStyle,
        menuVisible,
        listVisible,
        settingsVisible,
        panelVisible,
        openVisible,
        tableView,
        menuWidth,
        listWidth
    });
};
