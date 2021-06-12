import { FunctionComponent } from 'preact';
import { classes } from 'util/ui/classes';
import { withoutPropagation } from 'util/ui/events';

export const AppContextMenuItemView: FunctionComponent<{
    active: boolean;
    icon: string;
    title: string;
    hint?: string;

    onClick: () => void;
}> = ({ active, icon, title, hint, onClick }) => {
    return (
        <div
            class={classes({
                'dropdown__item': true,
                'dropdown__item--active': active
            })}
            onClick={withoutPropagation(onClick)}
        >
            <i class={`fa fa-${icon} dropdown__item-icon`} />{' '}
            <span class="dropdown__item-text">
                {title}
                {hint ? <span class="muted-color"> {hint}</span> : null}
            </span>
        </div>
    );
};
