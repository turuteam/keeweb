import { FunctionComponent } from 'preact';
import { LocWithReplace } from 'util/locale';
import { StringFormat } from 'util/formatting/string-format';

export const LocalizedWith: FunctionComponent<{ str: LocWithReplace; capitalize?: boolean }> = ({
    str,
    capitalize,
    children
}) => {
    let val = str.with('{}');
    if (capitalize) {
        val = StringFormat.capFirst(val);
    }
    const [first, ...rest] = val.split('{}');
    return (
        <>
            {first}
            {children}
            {rest}
        </>
    );
};
