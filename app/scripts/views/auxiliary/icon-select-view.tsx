import { FunctionComponent } from 'preact';
import { classes } from 'util/ui/classes';
import { Locale } from 'util/locale';

export const IconSelectView: FunctionComponent<{
    icons: string[];
    customIcons: Map<string, string>;
    selectedIcon: number | undefined;
    selectedCustomIcon: string | undefined;
    canDownloadFavicon: boolean;
    downloadingFavicon: boolean;
    downloadFaviconError: boolean;
    selectedIconDataUrl?: string;

    iconSelected: (iconId: number) => void;
    customIconSelected: (iconId: string) => void;
    selectOtherClicked: () => void;
    otherSelected: () => void;
    downloadFaviconClicked: () => void;
}> = ({
    icons,
    customIcons,
    selectedIcon,
    selectedCustomIcon,
    canDownloadFavicon,
    downloadingFavicon,
    downloadFaviconError,
    selectedIconDataUrl,

    iconSelected,
    customIconSelected,
    selectOtherClicked,
    otherSelected,
    downloadFaviconClicked
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

    const customIconClicked = (e: MouseEvent) => {
        if (!(e.target instanceof HTMLElement)) {
            return;
        }
        const iconEl = e.target.closest('[data-icon-id]');
        if (!(iconEl instanceof HTMLElement)) {
            return;
        }
        const iconId = iconEl.dataset.iconId as string;
        if (!iconId) {
            return;
        }
        customIconSelected(iconId);
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
                        onClick={downloadFaviconClicked}
                    >
                        <i
                            class={classes({
                                'fa': true,
                                'fa-cloud-download-alt':
                                    !downloadingFavicon && !downloadFaviconError,
                                'fa-spinner spin': downloadingFavicon,
                                'fa-ban': downloadFaviconError
                            })}
                        />
                        <kw-tip text={Locale.iconFavTitle} />
                    </span>
                ) : null}
                {selectedIconDataUrl ? (
                    <span
                        class="icon-select__icon icon-select__icon-btn icon-select__icon-select"
                        onClick={otherSelected}
                    >
                        <img src={selectedIconDataUrl} />
                    </span>
                ) : (
                    <span
                        class="icon-select__icon icon-select__icon-btn icon-select__icon-select"
                        onClick={selectOtherClicked}
                    >
                        <i class="fa fa-ellipsis-h" />
                        <kw-tip text={Locale.iconSelCustom} />
                    </span>
                )}
            </div>
            {customIcons.size > 0 ? (
                <div
                    class="icon-select__items icon-select__items--custom"
                    onClick={customIconClicked}
                >
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
