import 'web-components/kw-tip';
import 'web-components/kw-secure-input';

import { FunctionComponent, h } from 'preact';
import { AppView } from 'views/app-view';
import { RuntimeInfo } from 'const/runtime-info';
import { AppSettings } from 'models/app-settings';
import { Features } from 'util/features';
import { Workspace } from 'models/workspace';
import { useEffect, useState } from 'preact/hooks';

export const App: FunctionComponent = () => {
    const [mode, setMode] = useState(Workspace.mode);

    useEffect(() => {
        Workspace.onChange('mode', setMode);
        return () => {
            Workspace.offChange('mode', setMode);
        };
    }, []);

    const listVisible = mode === 'list';
    const panelVisible = mode === 'panel';
    const openVisible = mode === 'open';

    return h(AppView, {
        beta: RuntimeInfo.beta,
        customTitlebar: Features.renderCustomTitleBar,
        titlebarStyle: AppSettings.titlebarStyle,
        listVisible,
        panelVisible,
        openVisible
    });
};
