import { FunctionComponent } from 'preact';
import { SecureInput } from 'views/components/secure-input';
import { useState } from 'preact/hooks';

export const OpenView: FunctionComponent<{}> = ({}) => {
    const [state, set] = useState(10);
    if (state > 0) {
        setTimeout(() => set(state - 1), 1000);
    }

    return (
        <div class="open">
            <SecureInput autofocus={true} />
            <p>
                Hello, world: {state}! {state > 0 ? <kw-tip text="Boo!" /> : null}
            </p>
        </div>
    );
};
