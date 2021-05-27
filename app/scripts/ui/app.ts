import 'web-components/kw-tip';
import 'web-components/kw-secure-input';

import { h, FunctionComponent } from 'preact';
import { AppView } from 'views/app-view';
import { RuntimeInfo } from 'const/runtime-info';
import { AppSettings } from 'models/app-settings';
import { Features } from 'util/features';

export const App: FunctionComponent = () => {
    return h(AppView, {
        beta: RuntimeInfo.beta,
        customTitlebar: Features.renderCustomTitleBar,
        titlebarStyle: AppSettings.titlebarStyle
    });
};
