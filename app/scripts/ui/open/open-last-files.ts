import { h, FunctionComponent } from 'preact';
import { OpenLastFilesView } from 'views/open/open-last-files-view';
import { FileManager } from 'models/file-manager';
import { Storage } from 'storage';
import { AppSettings } from 'models/app-settings';
import { Alerts } from 'comp/ui/alerts';
import { Locale } from 'util/locale';
import { OpenState } from 'models/ui/open-state';

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

    const fileSelected = (id: string) => {
        if (OpenState.busy) {
            return;
        }
        const fileInfo = FileManager.getFileInfoById(id);
        if (fileInfo) {
            OpenState.selectFileInfo(fileInfo);
        }
    };

    const removeFileClicked = async (id: string) => {
        if (OpenState.busy) {
            return;
        }
        const fileInfo = FileManager.getFileInfoById(id);
        if (fileInfo) {
            if (!fileInfo.storage || fileInfo.modified) {
                const alertRes = await Alerts.yesno({
                    header: Locale.openRemoveLastQuestion,
                    body: fileInfo.modified
                        ? Locale.openRemoveLastQuestionModBody
                        : Locale.openRemoveLastQuestionBody
                }).wait();
                if (!alertRes) {
                    return;
                }
            }
            FileManager.removeFileInfo(id);
            OpenState.reset();
        }
    };

    return h(OpenLastFilesView, {
        lastOpenFiles,
        canRemoveLatest: AppSettings.canRemoveLatest,

        fileSelected,
        removeFileClicked
    });
};
