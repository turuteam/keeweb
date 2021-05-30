import { FunctionComponent } from 'preact';
import { OpenButtons } from 'ui/open/open-buttons';
import { OpenUnlockMessage } from 'ui/open/open-unlock-message';
import { OpenStorageConfig } from 'ui/open/open-storage-config';
import { OpenPassword } from 'ui/open/open-password';
import { OpenLastFiles } from 'ui/open/open-last-files';
import { OpenSettings } from 'ui/open/open-settings';
import { OpenDropzone } from 'ui/open/open-dropzone';
import { classes } from 'util/ui/classes';
import { useKey } from 'util/ui/hooks';
import { Keys } from 'const/keys';
import { useRef } from 'preact/hooks';

export const OpenScreenView: FunctionComponent<{
    fileSelected: boolean;
    keyFileSelected: boolean;
    visualFocus: boolean;
    dragInProgress: boolean;
    openingFile: boolean;

    onDragEnter: (e: DragEvent) => void;
}> = ({
    fileSelected,
    keyFileSelected,
    visualFocus,
    dragInProgress,
    openingFile,

    onDragEnter
}) => {
    const openEl = useRef<HTMLDivElement>();

    const enterKeyPress = () => {
        const el = openEl.current.querySelector('[tabindex]:focus');
        if (el instanceof HTMLDivElement) {
            el.click();
        }
    };

    useKey(Keys.DOM_VK_ENTER, enterKeyPress, undefined, 'open');
    useKey(Keys.DOM_VK_RETURN, enterKeyPress, undefined, 'open');

    return (
        <div
            ref={openEl}
            onDragEnter={onDragEnter}
            class={classes({
                'open': true,
                'open--file': fileSelected,
                'open--key-file': keyFileSelected,
                'open--show-focus': visualFocus,
                'open--drag': dragInProgress,
                'open--opening': openingFile
            })}
        >
            <OpenUnlockMessage />
            <OpenButtons />

            <div class="open__pass-area">
                <OpenPassword />
                <OpenSettings />
                <OpenLastFiles />
            </div>

            <OpenStorageConfig />
            <OpenDropzone />
        </div>
    );
};
