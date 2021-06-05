import { FunctionComponent } from 'preact';
import { classes } from 'util/ui/classes';
import { Locale } from 'util/locale';

export const ListItemShortView: FunctionComponent<{
    id: string;
    title?: string;
    description?: string;
    active?: boolean;
    expired?: boolean;
    icon?: string;
    customIcon?: string;
    color?: string;

    itemClicked?: () => void;
}> = ({ id, title, description, active, expired, icon, customIcon, color, itemClicked }) => {
    return (
        <div
            class={classes({
                'list__item': true,
                'list__item--active': active,
                'list__item--expired': expired
            })}
            id={id}
            draggable={true}
            onClick={itemClicked}
        >
            {customIcon ? (
                <img src={icon} class={`list__item-icon list__item-icon--custom ${color ?? ''}`} />
            ) : (
                <i
                    class={`fa fa-${icon ?? 'key'} ${
                        color ? `${color}-color` : ''
                    } list__item-icon`}
                />
            )}
            <span class="list__item-title">{title || `(${Locale.noTitle})`}</span>
            {description ? (
                <span class="list__item-descr thin">{description}</span>
            ) : (
                <span class="list__item-descr">&nbsp;</span>
            )}
        </div>
    );
};
