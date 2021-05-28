import { FunctionComponent, h } from 'preact';
import { FooterView } from 'views/footer-view';
import { Updater } from 'comp/app/updater';
import { FileManager } from 'models/file-manager';
import { Workspace } from 'models/workspace';
import { useModelField } from 'util/ui/hooks';

export const Footer: FunctionComponent = () => {
    const files = useModelField(FileManager, 'files');

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
