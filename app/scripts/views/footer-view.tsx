import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { classes } from 'util/ui/classes';

export interface FooterFile {
    id: string;
    name: string;
    syncing?: boolean;
    syncError?: string;
    modified?: boolean;
}

export const FooterView: FunctionComponent<{
    files: FooterFile[];
    updateAvailable: boolean;

    openClicked: () => void;
    lockWorkspaceClicked: () => void;
}> = ({ files, updateAvailable, openClicked, lockWorkspaceClicked }) => {
    return (
        <div class="footer">
            {files.map((file) => (
                <div key={file.id} class="footer__db footer__db-item">
                    <i class="fa fa-unlock" /> {file.name}
                    {file.syncing ? (
                        <i class="fa fa-sync-alt spin footer__db-sign" />
                    ) : file.syncError ? (
                        <i
                            class={classes({
                                'fa': true,
                                'fa-circle': file.modified,
                                'fa-circle-o': !file.modified,
                                'footer__db-sign': true,
                                'footer__db-sign--error': true
                            })}
                        >
                            <kw-tip text={`${Locale.footerSyncError}: ${file.syncError}`} />
                        </i>
                    ) : file.modified ? (
                        <i class="fa fa-circle footer__db-sign" />
                    ) : null}
                </div>
            ))}
            <div
                class="footer__db footer__db--dimmed footer__db--expanded footer__db-open"
                id="footer__db-open"
                onClick={openClicked}
            >
                <i class="fa fa-plus" />
                <span class="footer__db-text">&nbsp;{Locale.footerOpen}</span>
            </div>
            <div class="footer__btn footer__btn-help" tip-placement="top" id="footer__btn-help">
                <i class="fa fa-question" />
                <kw-tip text={Locale.help} />
            </div>
            <div
                class="footer__btn footer__btn-settings"
                tip-placement="top"
                id="footer__btn-settings"
            >
                <kw-tip text={Locale.settings} />
                {updateAvailable ? (
                    <i class="fa fa-bell footer__update-icon" />
                ) : (
                    <i class="fa fa-cog" />
                )}
            </div>
            <div
                class="footer__btn footer__btn-generate"
                tip-placement="top"
                id="footer__btn-generate"
            >
                <i class="fa fa-bolt" />
                <kw-tip text={Locale.footerTitleGen} />
            </div>
            <div
                class="footer__btn footer__btn-lock"
                tip-placement="top-left"
                id="footer__btn-lock"
                onClick={lockWorkspaceClicked}
            >
                <i class="fa fa-sign-out-alt" />
                <kw-tip text={Locale.footerTitleLock} />
            </div>
        </div>
    );
};
