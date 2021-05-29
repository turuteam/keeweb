import { h, FunctionComponent } from 'preact';
import { OpenLastFilesView } from 'views/open/open-last-files-view';
import { FileManager } from 'models/file-manager';
import { Storage } from 'storage';
import { AppSettings } from 'models/app-settings';
import { Workspace } from 'models/workspace';

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

    const lastFileSelected = (id: string) => {
        const fileInfo = FileManager.getFileInfoById(id);
        if (fileInfo) {
            Workspace.openState.selectFileInfo(fileInfo);
        }
    };

    return h(OpenLastFilesView, {
        lastOpenFiles,
        canRemoveLatest: AppSettings.canRemoveLatest,

        lastFileSelected
    });
};
