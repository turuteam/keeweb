import * as kdbxweb from 'kdbxweb';
import { h, FunctionComponent } from 'preact';
import { OpenPasswordView } from 'views/open/open-password-view';
import { AppSettings } from 'models/app-settings';
import { Workspace } from 'models/workspace';
import { useEvent, useModelWatcher } from 'util/ui/hooks';

export const OpenPassword: FunctionComponent = () => {
    useModelWatcher(Workspace.openState);

    useEvent('user-idle', () => {
        Workspace.openState.password = kdbxweb.ProtectedValue.fromString('');
    });

    const passwordChanged = (password: kdbxweb.ProtectedValue) => {
        Workspace.openState.password = password;
    };

    return h(OpenPasswordView, {
        password: Workspace.openState.password,
        canOpen: AppSettings.canOpen,

        passwordChanged
    });
};
