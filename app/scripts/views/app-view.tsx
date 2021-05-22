import { FunctionComponent } from 'preact';
import { Loading } from 'ui/loading';

export const AppView: FunctionComponent = () => {
    return (
        <div class="app">
            <Loading name="KeeWeb" />
        </div>
    );
};
