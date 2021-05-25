import { FunctionComponent } from 'preact';
import { LocWithReplace } from 'util/locale';

export const LocalizedWith: FunctionComponent<{ str: LocWithReplace }> = ({ str, children }) => {
    const [first, ...rest] = str.with('{}').split('{}');
    return (
        <>
            {first}
            {children}
            {rest}
        </>
    );
};
