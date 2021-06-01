import { FunctionComponent, h } from 'preact';
import { SettingsAboutView } from 'views/settings/settings-about-view';
import { RuntimeInfo } from 'const/runtime-info';
import { Features } from 'util/features';

export const SettingsAbout: FunctionComponent = () => {
    return h(SettingsAboutView, {
        version: RuntimeInfo.version,
        isDesktop: Features.isDesktop,
        year: new Date().getFullYear()
    });
};
