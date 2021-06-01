import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { LocalizedWith } from 'views/components/localized-with';
import { Links } from 'const/links';

export const SettingsHelpView: FunctionComponent<{
    appInfo: string;
    issueLink: string;
}> = ({ appInfo, issueLink }) => {
    return (
        <div class="settings__content">
            <h1>
                <i class="fa fa-question settings__head-icon" /> {Locale.help}
            </h1>
            <h2>{Locale.setHelpFormat}</h2>
            <p>
                <LocalizedWith str={Locale.setHelpFormatBody}>
                    <a href="https://keepass.info/" target="_blank" rel="noreferrer">
                        KeePass
                    </a>
                </LocalizedWith>
            </p>
            <h2>{Locale.setHelpProblems}</h2>
            <p>
                <LocalizedWith str={Locale.setHelpProblems1}>
                    {' '}
                    <a href={issueLink} target="_blank" rel="noreferrer">
                        {Locale.setHelpOpenIssue}
                    </a>
                </LocalizedWith>{' '}
                <LocalizedWith str={Locale.setHelpProblems2}>
                    <a href="https://antelle.net/" target="_blank" rel="noreferrer">
                        {Locale.setHelpContactLink}
                    </a>
                </LocalizedWith>
                .
            </p>
            <p>{Locale.setHelpAppInfo}:</p>
            <pre class="settings__pre input-base">{appInfo}</pre>
            <h2>{Locale.setHelpOtherPlatforms}</h2>
            <ul>
                <li>
                    <i class="fa fa-windows" /> <i class="fa fa-apple" /> <i class="fa fa-linux" />{' '}
                    <a href={Links.Desktop} target="_blank" rel="noreferrer">
                        {Locale.setHelpDesktopApps}
                    </a>
                </li>
                <li>
                    <i class="fa fa-chrome" /> <i class="fa fa-firefox-browser" />{' '}
                    <i class="fa fa-opera" /> <i class="fa fa-safari" /> <i class="fa fa-edge" />{' '}
                    <a href={Links.WebApp} target="_blank" rel="noreferrer">
                        {Locale.setHelpWebApp}
                    </a>
                </li>
            </ul>
            <h2>
                {Locale.setHelpUpdates} <i class="fa fa-twitter" />
            </h2>
            <p>
                {Locale.setHelpTwitter}:{' '}
                <a href="https://twitter.com/kee_web" target="_blank" rel="noreferrer">
                    kee_web
                </a>
            </p>
        </div>
    );
};
