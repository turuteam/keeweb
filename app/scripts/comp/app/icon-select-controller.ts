import { FileOpener } from 'util/browser/file-opener';
import { IconSelectState } from 'models/ui/icon-select-state';
import { Logger } from 'util/logger';
import { Events } from 'util/events';
import { IconUrlFormat } from 'util/formatting/icon-url-format';

const logger = new Logger('icon-select');

class IconSelectController {
    openFile() {
        FileOpener.open((file) => {
            FileOpener.readBinary(file)
                .then((fileData) => {
                    IconSelectState.selectedIconDataUrl =
                        IconUrlFormat.toDataUrl(fileData) ?? undefined;
                })
                .catch((ex) => logger.error('Error reading file', ex));
        }, 'image/*');
    }

    downloadFavicon(websiteUrl: string): void {
        if (IconSelectState.downloading) {
            return;
        }
        IconSelectState.setDownloading();
        const iconUrl = this.getIconUrl(websiteUrl);

        const img = document.createElement('img');
        img.crossOrigin = 'Anonymous';
        img.src = iconUrl;
        img.onload = () => {
            IconSelectState.downloading = false;
            logger.debug('Favicon downloaded', iconUrl);
            const data = this.getIconData(img);
            logger.debug(`Favicon data extracted: ${data.length} chars`);
            Events.emit('custom-icon-downloaded', data);
        };
        img.onerror = (e) => {
            logger.error('Favicon download error', iconUrl, e);
            IconSelectState.setDownloadError();
        };
    }

    private getIconUrl(websiteUrl: string): string {
        const domain = websiteUrl.replace(/^.*:\/+/, '').replace(/\/.*/, '');
        return 'https://services.keeweb.info/favicon/' + domain;
    }

    private getIconData(img: HTMLImageElement): string {
        const size = Math.min(img.width, 32);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;
        ctx?.drawImage(img, 0, 0, size, size);

        return canvas.toDataURL().replace(/^.*,/, '');
    }
}

const instance = new IconSelectController();

export { instance as IconSelectController };
