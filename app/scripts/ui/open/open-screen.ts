import { h, FunctionComponent } from 'preact';
import { OpenScreenView } from 'views/open/open-screen-view';
import { Workspace } from 'models/workspace';
import { useKey, useModal, useModelField } from 'util/ui/hooks';
import { Keys } from 'const/keys';
import { KeyHandler } from 'comp/browser/key-handler';
import { AppSettings } from 'models/app-settings';

export const OpenScreen: FunctionComponent = () => {
    useModal('open');

    const openFile = () => {
        Workspace.openState.chooseFile();
    };

    const setVisualFocus = () => {
        Workspace.openState.visualFocus = true;
    };

    const undoKeyPress = (e: KeyboardEvent) => e.preventDefault();

    const name = useModelField(Workspace.openState, 'name');
    const keyFileName = useModelField(Workspace.openState, 'keyFileName');
    const visualFocus = useModelField(Workspace.openState, 'visualFocus');
    const dragInProgress = useModelField(Workspace.openState, 'dragInProgress');

    useKey(Keys.DOM_VK_O, openFile, KeyHandler.SHORTCUT_ACTION, 'open');
    useKey(Keys.DOM_VK_DOWN, () => Workspace.openState.selectNextFile(), undefined, 'open');
    useKey(Keys.DOM_VK_UP, () => Workspace.openState.selectPreviousFile(), undefined, 'open');
    useKey(Keys.DOM_VK_TAB, setVisualFocus, undefined, 'open');
    useKey(Keys.DOM_VK_TAB, setVisualFocus, KeyHandler.SHORTCUT_SHIFT, 'open');
    useKey(Keys.DOM_VK_Z, undoKeyPress, undefined, 'open');

    const onDragEnter = (e: DragEvent) => {
        if (!AppSettings.canOpen || Workspace.openState.busy || !e.dataTransfer) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        const dt = e.dataTransfer;
        if (!dt.types?.includes('Files')) {
            dt.dropEffect = 'none';
            return;
        }
        dt.dropEffect = 'copy';
        Workspace.openState.dragInProgress = true;
    };

    return h(OpenScreenView, {
        fileSelected: !!name,
        keyFileSelected: !!keyFileName,
        visualFocus,
        dragInProgress,

        onDragEnter
    });
};
