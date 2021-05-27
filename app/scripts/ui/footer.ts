import { FunctionComponent, h } from 'preact';
import { FooterView } from 'views/footer-view';
import { Updater } from 'comp/app/updater';
import { FileManager } from 'models/file-manager';
import { Workspace } from 'models/workspace';
import { useEffect, useState } from 'preact/hooks';

export const Footer: FunctionComponent = () => {
    const [files, setFiles] = useState(FileManager.files);

    useEffect(() => {
        FileManager.onChange('files', setFiles);
        return () => FileManager.offChange('files', setFiles);
    }, []);

    if (!files.length) {
        return null;
    }

    const updateAvailable = Updater.updateStatus === 'ready' || Updater.updateStatus === 'found';

    const openClicked = () => Workspace.toggleOpen();

    const lockWorkspaceClicked = () => Workspace.lockWorkspace();

    return h(FooterView, {
        files,
        updateAvailable,

        openClicked,
        lockWorkspaceClicked
    });
};
