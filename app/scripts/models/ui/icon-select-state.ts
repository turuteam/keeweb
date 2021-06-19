import { Model } from 'util/model';

class IconSelectState extends Model {
    downloading = false;
    downloadError = false;
    selectedIconDataUrl?: string;

    setDownloading() {
        this.batchSet(() => {
            this.downloadError = false;
            this.downloading = true;
        });
    }

    setDownloadError() {
        this.batchSet(() => {
            this.downloadError = true;
            this.downloading = false;
        });
    }
}

const instance = new IconSelectState();

export { instance as IconSelectState };
