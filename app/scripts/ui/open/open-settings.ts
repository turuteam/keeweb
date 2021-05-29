import { h, FunctionComponent } from 'preact';
import { OpenSettingsView } from 'views/open/open-settings-view';
import { Launcher } from 'comp/launcher';
import { Storage } from 'storage';
import { AppSettings } from 'models/app-settings';
import { UsbListener } from 'comp/devices/usb-listener';
import { useModelField } from 'util/ui/hooks';
import { Workspace } from 'models/workspace';

export const OpenSettings: FunctionComponent = () => {
    const name = useModelField(Workspace.openState, 'name');
    const keyFileName = useModelField(Workspace.openState, 'keyFileName');

    const hasYubiKeys = UsbListener.attachedYubiKeys > 0;
    const canUseChalRespYubiKey = hasYubiKeys && AppSettings.yubiKeyShowChalResp;

    const selectKeyFileClicked = () => {
        if (keyFileName) {
            Workspace.openState.clearKeyFile();
        } else {
            Workspace.openState.selectKeyFile();
        }
    };

    const selectKeyFileFromDropboxClicked = () => {
        Workspace.openState.selectKeyFileFromDropbox();
    };

    return h(OpenSettingsView, {
        canSelectKeyFile: !!name,
        canOpenKeyFromDropbox: !Launcher && Storage.dropbox.enabled,
        canUseChalRespYubiKey,
        keyFileName,

        selectKeyFileClicked,
        selectKeyFileFromDropboxClicked
    });
};
