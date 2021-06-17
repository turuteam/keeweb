import { FunctionComponent, h } from 'preact';
import { IconSelectView } from 'views/auxiliary/icon-select-view';
import { IconMap } from 'const/icon-map';
import { File } from 'models/file';
import { FileOpener } from 'util/browser/file-opener';

export const IconSelect: FunctionComponent<{
    file: File;
    icon: number | undefined;
    customIcon: string | undefined;
    websiteUrl?: string;

    iconSelected: (iconId: number) => void;
    customIconSelected: (id: string) => void;
}> = ({ file, icon, customIcon, websiteUrl, iconSelected }) => {
    const selectOtherClicked = () => {
        FileOpener.open((file) => {
            console.log('f', file);
        }, 'image/*');
    };

    return h(IconSelectView, {
        icons: IconMap,
        customIcons: file.getCustomIcons(),
        selectedIcon: icon,
        selectedCustomIcon: customIcon,
        canDownloadFavicon: !!websiteUrl,

        iconSelected,
        selectOtherClicked
    });
};
