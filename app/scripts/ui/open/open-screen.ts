import { h, FunctionComponent } from 'preact';
import { OpenScreenView } from 'views/open/open-screen-view';
import { useKey, useModal, useModelField } from 'util/ui/hooks';
import { Keys } from 'const/keys';
import { KeyHandler } from 'comp/browser/key-handler';
import { AppSettings } from 'models/app-settings';
import { OpenController } from 'comp/app/open-controller';
import { OpenState } from 'models/open-state';

export const OpenScreen: FunctionComponent = () => {
    useModal('open');

    const openFile = () => {
        OpenController.chooseFile();
    };

    const setVisualFocus = () => {
        OpenState.visualFocus = true;
    };

    const undoKeyPress = (e: KeyboardEvent) => e.preventDefault();

    const name = useModelField(OpenState, 'name');
    const keyFileName = useModelField(OpenState, 'keyFileName');
    const visualFocus = useModelField(OpenState, 'visualFocus');
    const dragInProgress = useModelField(OpenState, 'dragInProgress');
    const openingFile = useModelField(OpenState, 'openingFile');

    useKey(Keys.DOM_VK_O, openFile, KeyHandler.SHORTCUT_ACTION, 'open');
    useKey(Keys.DOM_VK_DOWN, () => OpenState.selectNextFile(), undefined, 'open');
    useKey(Keys.DOM_VK_UP, () => OpenState.selectPreviousFile(), undefined, 'open');
    useKey(Keys.DOM_VK_TAB, setVisualFocus, undefined, 'open');
    useKey(Keys.DOM_VK_TAB, setVisualFocus, KeyHandler.SHORTCUT_SHIFT, 'open');
    useKey(Keys.DOM_VK_Z, undoKeyPress, undefined, 'open');

    const onDragEnter = (e: DragEvent) => {
        if (!AppSettings.canOpen || OpenState.busy || !e.dataTransfer) {
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
        OpenState.dragInProgress = true;
    };

    return h(OpenScreenView, {
        fileSelected: !!name,
        keyFileSelected: !!keyFileName,
        visualFocus,
        dragInProgress,
        openingFile,

        onDragEnter
    });
};
