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

        const dataFile = files.find((file) => /\.kdbx$/i.test(file.name));
        const keyFile = files.find((file) => /\.keyx?$/i.test(file.name));

        if (dataFile) {
            Workspace.openState.readFileAndKeyFile(dataFile, keyFile);
            return;
        }

        if (AppSettings.canImportXml) {
            const xmlFile = files.find((file) => /\.xml$/i.test(file.name));
            if (xmlFile) {
                // TODO: import XML
                return;
            }
        }

        if (AppSettings.canImportCsv) {
            const csvFile = files.find((file) => /\.csv$/i.test(file.name));
            if (csvFile) {
                // Events.emit('import-csv-requested', csvFile); // TODO: import CSV
            }
        }
    };

    return h(OpenDropzoneView, {
        onDragOver,
        onDragLeave,
        onDrop
    });
};
