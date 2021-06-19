import { FunctionComponent, h } from 'preact';
import { IconSelectView } from 'views/auxiliary/icon-select-view';
import { IconMap } from 'const/icon-map';
import { File } from 'models/file';
import { IconSelectState } from 'models/ui/icon-select-state';
import { IconSelectController } from 'comp/app/icon-select-controller';
import { useModelWatcher } from 'util/ui/hooks';
import { IconUrlFormat } from 'util/formatting/icon-url-format';

export const IconSelect: FunctionComponent<{
    file: File;
    icon: number | undefined;
    customIcon: string | undefined;
    websiteUrl?: string;

    iconSelected: (iconId: number) => void;
    customIconSelected: (id: string) => void;
}> = ({ file, icon, customIcon, websiteUrl, iconSelected, customIconSelected }) => {
    useModelWatcher(IconSelectState);

    const selectOtherClicked = () => {
        IconSelectController.openFile();
    };

    const downloadFaviconClicked = () => {
        if (websiteUrl) {
            IconSelectController.downloadFavicon(websiteUrl);
        }
    };

    const otherSelected = () => {
        if (IconSelectState.selectedIconDataUrl) {
            const base64data = IconUrlFormat.dataUrlToBase64(IconSelectState.selectedIconDataUrl);
            const id = file.addCustomIcon(base64data);
            customIconSelected(id);
        }
    };

    return h(IconSelectView, {
        icons: IconMap,
        customIcons: file.getCustomIcons(),
        selectedIcon: customIcon ? undefined : icon,
        selectedCustomIcon: customIcon,
        canDownloadFavicon: !!websiteUrl,
        downloadingFavicon: IconSelectState.downloading,
        downloadFaviconError: IconSelectState.downloadError,
        selectedIconDataUrl: IconSelectState.selectedIconDataUrl,

        iconSelected,
        customIconSelected,
        otherSelected,
        selectOtherClicked,
        downloadFaviconClicked
    });
};
