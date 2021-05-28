import { FunctionComponent } from 'preact';
import { OpenButtons } from 'ui/open/open-buttons';
import { OpenUnlockMessage } from 'ui/open/open-unlock-message';
import { OpenDropzoneView } from 'views/open/open-dropzone-view';
import { OpenStorageConfig } from 'ui/open/open-storage-config';
import { OpenPassword } from 'ui/open/open-password';
import { OpenLastFiles } from 'ui/open/open-last-files';
import { OpenSettings } from 'ui/open/open-settings';

export const OpenScreenView: FunctionComponent = () => {
    return (
        <div class="open">
            <OpenUnlockMessage />
            <OpenButtons />

            <div class="open__pass-area">
                <OpenPassword />
                <OpenSettings />
                <OpenLastFiles />
            </div>

            <OpenStorageConfig />
            <OpenDropzoneView />
        </div>
    );
};
