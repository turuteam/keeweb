import { h, FunctionComponent } from 'preact';
import { OpenDropzoneView } from 'views/open/open-dropzone-view';
import { AppSettings } from 'models/app-settings';
import { OpenController } from 'comp/app/open-controller';
import { OpenState } from 'models/ui/open-state';

export const OpenDropzone: FunctionComponent = () => {
    const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onDragLeave = () => {
        if (!AppSettings.canOpen || OpenState.busy) {
            return;
        }
        OpenState.dragInProgress = false;
    };

    const onDrop = (e: DragEvent) => {
        if (!AppSettings.canOpen || OpenState.busy || !e.dataTransfer?.files) {
            return;
        }
        e.preventDefault();
        OpenState.dragInProgress = false;

        const files = [...e.dataTransfer.files];
        OpenController.readDroppedFiles(files);
    };

    return h(OpenDropzoneView, {
        onDragOver,
        onDragLeave,
        onDrop
    });
};
