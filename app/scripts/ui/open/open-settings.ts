import { h, FunctionComponent } from 'preact';
import { OpenSettingsView } from 'views/open/open-settings-view';
import { Launcher } from 'comp/launcher';
import { Storage } from 'storage';
import { AppSettings } from 'models/app-settings';
import { UsbListener } from 'comp/devices/usb-listener';
import { useModelField } from 'util/ui/hooks';
import { OpenController } from 'comp/app/open-controller';
import { OpenState } from 'models/ui/open-state';

export const OpenSettings: FunctionComponent = () => {
    const name = useModelField(OpenState, 'name');
    const keyFileName = useModelField(OpenState, 'keyFileName');

    const hasYubiKeys = UsbListener.attachedYubiKeys > 0;
    const canUseChalRespYubiKey = hasYubiKeys && AppSettings.yubiKeyShowChalResp;

    const selectKeyFileClicked = () => {
        if (keyFileName) {
            OpenState.clearKeyFile();
        } else {
            OpenController.chooseKeyFile();
        }
    };

    const selectKeyFileFromDropboxClicked = () => {
        OpenController.selectKeyFileFromDropbox();
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
