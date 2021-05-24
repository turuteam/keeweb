import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import 'web-components/kw-tip';

export const AppView: FunctionComponent = () => {
    const [counter, setCounter] = useState(10);

    if (counter > 0) {
        setTimeout(() => setCounter(counter - 1), 1000);
    }

    return (
        <div class="app">
            <p>
                Hello, world! Counter={counter}
                {counter > 0 ? <kw-tip text="This is a tooltip" /> : null}
            </p>
        </div>
    );
};
