import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { classes } from 'util/ui/classes';

export const OpenSettingsView: FunctionComponent<{
    canOpenKeyFromDropbox: boolean;
    canUseChalRespYubiKey: boolean;
}> = ({ canOpenKeyFromDropbox, canUseChalRespYubiKey }) => {
    let tabIndex = 0;
    return (
        <div class="open__settings">
            <div class="open__settings-key-file hide" tabIndex={++tabIndex}>
                <i class="fa fa-key open__settings-key-file-icon" />
                <span class="open__settings-key-file-name">{Locale.openKeyFile}</span>
                {canOpenKeyFromDropbox ? (
                    <span class="open__settings-key-file-dropbox">
                        {' '}
                        {Locale.openKeyFileDropbox}
                    </span>
                ) : null}
            </div>
            <div
                class={classes({
                    'open__settings-yubikey': true,
                    'open__settings-yubikey--present': canUseChalRespYubiKey
                })}
                tabIndex={++tabIndex}
            >
                <kw-tip text="YubiKey" />
                <div class="open__settings-yubikey__text">YK</div>{' '}
                <i class="fa fa-usb-token open__settings-yubikey-img" />
            </div>
        </div>
    );
};
