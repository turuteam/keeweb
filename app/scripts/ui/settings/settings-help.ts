import { FunctionComponent, h } from 'preact';
import { SettingsHelpView } from 'views/settings/settings-help-view';
import { RuntimeInfo } from 'const/runtime-info';
import { Launcher } from 'comp/launcher';
import { Links } from 'const/links';

export const SettingsHelp: FunctionComponent = () => {
    const appInfo =
        'KeeWeb v' +
        RuntimeInfo.version +
        ' (' +
        RuntimeInfo.commit +
        ', ' +
        RuntimeInfo.buildDate +
        ')\n' +
        'Environment: ' +
        (Launcher ? Launcher.name + ' v' + Launcher.version : 'web') +
        '\n' +
        'User-Agent: ' +
        navigator.userAgent;

    const issueLink =
        Links.Repo +
        '/issues/new?body=' +
        encodeURIComponent('# please describe your issue here\n\n' + appInfo);

    return h(SettingsHelpView, {
        appInfo,
        issueLink
    });
};
