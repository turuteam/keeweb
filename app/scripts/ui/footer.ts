import { FunctionComponent, h } from 'preact';
import { FooterView } from 'views/footer-view';
import { Updater } from 'comp/app/updater';
import { FileManager } from 'models/file-manager';
import { Workspace } from 'models/workspace';
import { useModelField } from 'util/ui/hooks';

export const Footer: FunctionComponent = () => {
    const files = useModelField(FileManager, 'files');
    const updateStatus = useModelField(Updater, 'updateStatus');

    if (!files.length) {
        return null;
    }

    const updateAvailable = updateStatus === 'ready' || updateStatus === 'found';

    const fileClicked = (id: string) => Workspace.toggleSettings('file', id);

    const openClicked = () => Workspace.toggleOpen();

    const helpClicked = () => Workspace.toggleSettings('help');

    const settingsClicked = () => Workspace.toggleSettings('general');

    const lockWorkspaceClicked = () => Workspace.lockWorkspace();

    return h(FooterView, {
        files,
        updateAvailable,

        fileClicked,
        openClicked,
        helpClicked,
        settingsClicked,
        lockWorkspaceClicked
    });
};
