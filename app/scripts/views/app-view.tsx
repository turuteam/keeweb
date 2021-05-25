import { FunctionComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { KwSecureInput } from 'web-components/kw-secure-input';

export const AppView: FunctionComponent = () => {
    const [counter, setCounter] = useState(10);

    if (counter > 0) {
        setTimeout(() => setCounter(counter - 1), 1000);
    }

    const inputRef = useRef<KwSecureInput>();

    const inputChanged = () => {
        // eslint-disable-next-line no-console
        console.log('changed', inputRef.current.value.getText());
    };

    return (
        <div class="app">
            <p>
                Hello, world! Counter={counter}
                {counter > 0 ? <kw-tip text="This is a tooltip" /> : null}
            </p>
            <p>
                <kw-secure-input
                    class="sec-input"
                    value="Hello!"
                    onInput={inputChanged}
                    ref={inputRef}
                    autofocus
                    readonly={counter === 0}
                    placeholder={`Enter text: ${counter}`}
                />
            </p>
        </div>
    );
};
