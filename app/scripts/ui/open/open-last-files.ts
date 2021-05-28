import { h, FunctionComponent } from 'preact';
import { OpenLastFilesView } from 'views/open/open-last-files-view';
import { FileManager } from 'models/file-manager';
import { Storage } from 'storage';
import { AppSettings } from 'models/app-settings';

export const OpenLastFiles: FunctionComponent = () => {
    const lastOpenFiles = FileManager.fileInfos.map((fi) => {
        const storage = Storage.get(fi.storage ?? '');
        const icon = storage?.icon ?? 'file-alt';
        const path = fi.storage === 'file' || fi.storage === 'webdav' ? fi.path : undefined;
        return {
            id: fi.id,
            name: fi.name,
            path,
            icon
        };
    });

    return h(OpenLastFilesView, {
        lastOpenFiles,
        canRemoveLatest: AppSettings.canRemoveLatest
    });
};
