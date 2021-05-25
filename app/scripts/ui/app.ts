import { h, FunctionComponent } from 'preact';
import { AppView } from 'views/app-view';

import 'web-components/kw-tip';
import 'web-components/kw-secure-input';

export const App: FunctionComponent = () => {
    return h(AppView, null);
};
