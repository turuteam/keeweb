import { h, FunctionComponent } from 'preact';
import { OpenDropzoneView } from 'views/open/open-dropzone-view';
import { AppSettings } from 'models/app-settings';
import { Workspace } from 'models/workspace';

export const OpenDropzone: FunctionComponent = () => {
    const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onDragLeave = () => {
        if (!AppSettings.canOpen || Workspace.openState.busy) {
            return;
        }
        Workspace.openState.dragInProgress = false;
    };

    const onDrop = (e: DragEvent) => {
        if (!AppSettings.canOpen || Workspace.openState.busy || !e.dataTransfer?.files) {
            return;
        }
        e.preventDefault();
        Workspace.openState.dragInProgress = false;

        const files = [...e.dataTransfer.files];
        Workspace.openState.readDroppedFiles(files);
    };

    return h(OpenDropzoneView, {
        onDragOver,
        onDragLeave,
        onDrop
    });
};
