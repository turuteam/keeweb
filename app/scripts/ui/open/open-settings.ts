import { h, FunctionComponent } from 'preact';
import { OpenSettingsView } from 'views/open/open-settings-view';
import { Launcher } from 'comp/launcher';
import { Storage } from 'storage';
import { AppSettings } from 'models/app-settings';
import { UsbListener } from 'comp/devices/usb-listener';

export const OpenSettings: FunctionComponent = () => {
    const hasYubiKeys = UsbListener.attachedYubiKeys > 0;
    const canUseChalRespYubiKey = hasYubiKeys && AppSettings.yubiKeyShowChalResp;

    return h(OpenSettingsView, {
        canOpenKeyFromDropbox: !Launcher && Storage.dropbox.enabled,
        canUseChalRespYubiKey
    });
};
