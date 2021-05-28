import { h, FunctionComponent } from 'preact';
import { OpenPasswordView } from 'views/open/open-password-view';
import { AppSettings } from 'models/app-settings';

export const OpenPassword: FunctionComponent = () => {
    return h(OpenPasswordView, {
        canOpen: AppSettings.canOpen
    });
};
