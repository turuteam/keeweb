import { h, FunctionComponent } from 'preact';
import { OpenLastFilesView } from 'views/open/open-last-files-view';
import { FileManager } from 'models/file-manager';
import { Storage } from 'storage';
import { AppSettings } from 'models/app-settings';
import { Workspace } from 'models/workspace';
import { Alerts } from 'comp/ui/alerts';
import { Locale } from 'util/locale';

export const OpenLastFiles: FunctionComponent = () => {
    const lastOpenFiles = FileManager.getFileInfosToOpen().map((fi) => {
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

    const fileSelected = (id: string) => {
        if (Workspace.openState.busy) {
            return;
        }
        const fileInfo = FileManager.getFileInfoById(id);
        if (fileInfo) {
            Workspace.openState.selectFileInfo(fileInfo);
        }
    };

    const removeFileClicked = (id: string) => {
        if (Workspace.openState.busy) {
            return;
        }
        const fileInfo = FileManager.getFileInfoById(id);
        if (fileInfo) {
            if (!fileInfo.storage || fileInfo.modified) {
                Alerts.yesno({
                    header: Locale.openRemoveLastQuestion,
                    body: fileInfo.modified
                        ? Locale.openRemoveLastQuestionModBody
                        : Locale.openRemoveLastQuestionBody,
                    buttons: [
                        { result: 'yes', title: Locale.alertYes },
                        { result: '', title: Locale.alertNo }
                    ],
                    success: () => {
                        FileManager.removeFileInfo(id);
                    }
                });
            } else {
                FileManager.removeFileInfo(id);
            }
        }
    };

    return h(OpenLastFilesView, {
        lastOpenFiles,
        canRemoveLatest: AppSettings.canRemoveLatest,

        fileSelected,
        removeFileClicked
    });
};
