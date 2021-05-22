import { h, FunctionComponent } from 'preact';
import { LoadingView } from 'views/loading-view';

export const Loading: FunctionComponent<{ name: string }> = ({ name }) => {
    return h(LoadingView, { name });
};
