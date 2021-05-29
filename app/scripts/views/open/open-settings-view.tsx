import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { classes } from 'util/ui/classes';
import { withoutPropagation } from 'util/ui/events';

export const OpenSettingsView: FunctionComponent<{
    canSelectKeyFile: boolean;
    canOpenKeyFromDropbox: boolean;
    canUseChalRespYubiKey: boolean;
    keyFileName?: string;

    selectKeyFileClicked: () => void;
    selectKeyFileFromDropboxClicked: () => void;
}> = ({
    canSelectKeyFile,
    canOpenKeyFromDropbox,
    canUseChalRespYubiKey,
    keyFileName,

    selectKeyFileClicked,
    selectKeyFileFromDropboxClicked
}) => {
    let tabIndex = 300;

    return (
        <div class="open__settings">
            {canSelectKeyFile ? (
                <div
                    class="open__settings-key-file"
                    tabIndex={++tabIndex}
                    onClick={selectKeyFileClicked}
                >
                    <i class="fa fa-key open__settings-key-file-icon" />
                    <span class="open__settings-key-file-name">
                        {keyFileName || Locale.openKeyFile}
                    </span>
                    {canOpenKeyFromDropbox ? (
                        <span
                            class="open__settings-key-file-dropbox"
                            onClick={withoutPropagation(selectKeyFileFromDropboxClicked)}
                        >
                            {' '}
                            {Locale.openKeyFileDropbox}
                        </span>
                    ) : null}
                </div>
            ) : undefined}
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
