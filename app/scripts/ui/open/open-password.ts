import * as kdbxweb from 'kdbxweb';
import { h, FunctionComponent } from 'preact';
import { OpenPasswordView } from 'views/open/open-password-view';
import { useEvent, useModelWatcher } from 'util/ui/hooks';
import { Locale } from 'util/locale';
import { AppSettings } from 'models/app-settings';
import { Keys } from 'const/keys';
import { OpenController } from 'comp/app/open-controller';
import { Alerts } from 'comp/ui/alerts';
import { OpenState } from 'models/ui/open-state';

export const OpenPassword: FunctionComponent = () => {
    useModelWatcher(OpenState);

    useEvent('user-idle', () => {
        OpenState.password = kdbxweb.ProtectedValue.fromString('');
    });

    const passwordClicked = () => {
        OpenController.chooseFile();
    };

    const passwordChanged = (password: kdbxweb.ProtectedValue) => {
        OpenState.password = password;
    };

    const passwordKeyUp = (e: KeyboardEvent) => {
        const code = e.keyCode || e.which;
        if (code === Keys.DOM_VK_CAPS_LOCK) {
            OpenState.capsLockPressed = false;
        }
    };

    const passwordKeyDown = (e: KeyboardEvent) => {
        const code = e.keyCode || e.which;
        if (code === Keys.DOM_VK_RETURN) {
            OpenController.open();
        } else if (code === Keys.DOM_VK_CAPS_LOCK) {
            OpenState.capsLockPressed = false;
        }
    };

    const passwordKeyPress = (e: KeyboardEvent) => {
        const charCode = e.keyCode || e.which;
        const ch = String.fromCharCode(charCode);
        const lower = ch.toLowerCase();
        const upper = ch.toUpperCase();
        if (lower !== upper && !e.shiftKey) {
            OpenState.capsLockPressed = ch !== lower;
        }
    };

    let passwordPlaceholder = '';
    if (OpenState.name) {
        passwordPlaceholder = `${Locale.openPassFor} ${OpenState.name}`;
    } else if (AppSettings.canOpen) {
        passwordPlaceholder = Locale.openClickToOpen;
    }

    const submitClicked = () => {
        OpenController.open();
    };

    return h(OpenPasswordView, {
        password: OpenState.password,
        passwordReadOnly: !OpenState.name,
        passwordPlaceholder,
        autoFocusPassword: !Alerts.alertDisplayed && OpenState.autoFocusPassword,
        buttonFingerprint: false,
        capsLockPressed: OpenState.capsLockPressed,
        openingFile: OpenState.openingFile,
        showInputError: OpenState.openError && OpenState.invalidKey,

        passwordClicked,
        passwordChanged,
        passwordKeyUp,
        passwordKeyDown,
        passwordKeyPress,
        submitClicked
    });
};
