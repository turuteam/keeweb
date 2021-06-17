import { FunctionComponent } from 'preact';
import { classes } from 'util/ui/classes';
import { Locale } from 'util/locale';

export const IconSelectView: FunctionComponent<{
    icons: string[];
    customIcons: Map<string, string>;
    selectedIcon: number | undefined;
    selectedCustomIcon: string | undefined;
    canDownloadFavicon: boolean;

    iconSelected: (iconId: number) => void;
    selectOtherClicked: () => void;
}> = ({
    icons,
    customIcons,
    selectedIcon,
    selectedCustomIcon,
    canDownloadFavicon,

    iconSelected,
    selectOtherClicked
}) => {
    const iconClicked = (e: MouseEvent) => {
        if (!(e.target instanceof HTMLElement)) {
            return;
        }
        const iconId = e.target.dataset.iconId as string;
        if (!iconId) {
            return;
        }
        iconSelected(+iconId);
    };

    return (
        <div class="icon-select">
            <div class="icon-select__items" onClick={iconClicked}>
                {icons.map((icon, ix) => (
                    <i
                        key={icon}
                        class={classes({
                            'fa': true,
                            [`fa-${icon}`]: true,
                            'icon-select__icon': true,
                            'icon-select__icon--active': ix === selectedIcon
                        })}
                        data-icon-id={ix}
                    />
                ))}
            </div>
            <div class="icon-select__items icon-select__items--actions">
                <input type="file" class="icon-select__file-input hide-by-pos" accept="image/*" />
                {canDownloadFavicon ? (
                    <span
                        class="icon-select__icon icon-select__icon-btn icon-select__icon-download"
                        data-val="special"
                        data-special="download"
                    >
                        <i class="fa fa-cloud-download-alt" />
                        <kw-tip text={Locale.iconFavTitle} />
                    </span>
                ) : null}
                <span
                    class="icon-select__icon icon-select__icon-btn icon-select__icon-select"
                    data-val="special"
                    data-special="select"
                    onClick={selectOtherClicked}
                >
                    <i class="fa fa-ellipsis-h" />
                    <kw-tip text={Locale.iconSelCustom} />
                </span>
            </div>
            {customIcons.size > 0 ? (
                <div class="icon-select__items icon-select__items--custom">
                    {[...customIcons.entries()].map(([id, icon]) => (
                        <span
                            key={id}
                            class={classes({
                                'icon-select__icon': true,
                                'icon-select__icon-btn': true,
                                'icon-select__icon-custom': true,
                                'icon-select__icon--active': id === selectedCustomIcon
                            })}
                            data-icon-id={id}
                        >
                            <img src={icon} />
                        </span>
                    ))}
                </div>
            ) : null}
        </div>
    );
};
