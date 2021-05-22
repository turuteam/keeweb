import { FunctionComponent } from 'preact';

export const LoadingView: FunctionComponent<{ name: string }> = ({ name }) => {
    return <div class="loading">Loading {name}...</div>;
};
