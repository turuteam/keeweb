import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { SecureInput } from 'views/components/secure-input';
import { classes } from 'util/ui/classes';

interface StorageProvider {
    name: string;
    icon?: string;
}

interface LastOpenFile {
    id: string;
    name: string;
    path?: string;
    icon?: string;
}

export const OpenView: FunctionComponent<{
    unlockMessage?: string;
    secondRowVisible: boolean;
    showOpen: boolean;
    showCreate: boolean;
    showYubiKey: boolean;
    showDemoInFirstRow: boolean;
    showDemoInSecondRow: boolean;
    showMore: boolean;
    showLogo: boolean;
    showGenerator: boolean;
    showSettings: boolean;
    storageProviders: StorageProvider[];
    canOpenKeyFromDropbox: boolean;
    lastOpenFiles: LastOpenFile[];
    canRemoveLatest: boolean;
    canUseChalRespYubiKey: boolean;

    moreClicked: () => void;
    newClicked: () => void;
    openDemoClicked: () => void;
}> = ({
    unlockMessage,
    secondRowVisible,
    showOpen,
    showCreate,
    showYubiKey,
    showDemoInFirstRow,
    showDemoInSecondRow,
    showMore,
    showLogo,
    showGenerator,
    showSettings,
    storageProviders,
    canOpenKeyFromDropbox,
    lastOpenFiles,
    canRemoveLatest,
    canUseChalRespYubiKey,

    moreClicked,
    newClicked,
    openDemoClicked
}) => {
    let tabIndex = 0;

    return (
        <div class="open">
            <input type="file" class="open__file-ctrl hide-by-pos" />
            {unlockMessage ? (
                <div class="open__message">
                    <div class="open__message-content">{unlockMessage ?? null}</div>
                    <div class="open__message-cancel-btn" tip-placement="left">
                        <i class="fa fa-times-circle open__message-cancel-btn-icon" />
                        <kw-tip text={Locale.alertCancel} />
                    </div>
                </div>
            ) : null}
            <div class="open__icons">
                {showOpen ? (
                    <div class="open__icon open__icon-open" tabIndex={++tabIndex}>
                        <i class="fa fa-lock open__icon-i" />
                        <div class="open__icon-text">{Locale.openOpen}</div>
                    </div>
                ) : null}
                {showCreate ? (
                    <div
                        class="open__icon open__icon-new"
                        tabIndex={++tabIndex}
                        onClick={newClicked}
                    >
                        <i class="fa fa-plus open__icon-i" />
                        <div class="open__icon-text">{Locale.openNew}</div>
                    </div>
                ) : null}
                {showYubiKey ? (
                    <div class="open__icon open__icon-yubikey" tabIndex={++tabIndex}>
                        <i class="fa fa-usb-token open__icon-i" />
                        <div class="open__icon-text">YubiKey</div>
                    </div>
                ) : null}
                {showDemoInFirstRow ? (
                    <div
                        class="open__icon open__icon-demo"
                        tabIndex={++tabIndex}
                        onClick={openDemoClicked}
                    >
                        <i class="fa fa-magic open__icon-i" />
                        <div class="open__icon-text">{Locale.openDemo}</div>
                    </div>
                ) : null}
                {showMore ? (
                    <div
                        class="open__icon open__icon-more"
                        tabIndex={++tabIndex}
                        onClick={moreClicked}
                    >
                        <i class="fa fa-ellipsis-h open__icon-i" />
                        <div class="open__icon-text">{Locale.openMore}</div>
                    </div>
                ) : null}
                {showLogo ? (
                    <div class="open__icon open__icon-more">
                        <i class="fa fa-keeweb open__icon-i" />
                        <div class="open__icon-text">KeeWeb</div>
                    </div>
                ) : null}
            </div>
            {secondRowVisible ? (
                <div class="open__icons open__icons--lower">
                    {storageProviders.map((prv) => (
                        <div
                            class="open__icon open__icon-storage"
                            tabIndex={++tabIndex}
                            key={prv.name}
                        >
                            {prv.icon ? <i class={`fa fa-${prv.icon} open__icon-i`} /> : null}
                            <div class="open__icon-text">{Locale.get(prv.name)}</div>
                        </div>
                    ))}
                    {showDemoInSecondRow ? (
                        <div
                            class="open__icon open__icon-demo"
                            tabIndex={++tabIndex}
                            onClick={openDemoClicked}
                        >
                            <i class="fa fa-magic open__icon-i" />
                            <div class="open__icon-text">{Locale.openDemo}</div>
                        </div>
                    ) : null}
                    {showGenerator ? (
                        <div class="open__icon open__icon-generate" tabIndex={++tabIndex}>
                            <i class="fa fa-bolt open__icon-i" />
                            <div class="open__icon-text">{Locale.openGenerate}</div>
                        </div>
                    ) : null}
                    {showSettings ? (
                        <div class="open__icon open__icon-settings" tabIndex={++tabIndex}>
                            <i class="fa fa-cog open__icon-i" />
                            <div class="open__icon-text">{Locale.settings}</div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div class="open__pass-area">
                <div class="hide">
                    {/* we need these inputs to screw browsers passwords autocompletion */}
                    <input type="text" name="username" />
                    <input type="password" name="password" />
                </div>
                <div class="open__pass-warn-wrap">
                    <div class="open__pass-warning muted-color invisible">
                        <i class="fa fa-exclamation-triangle" /> {Locale.openCaps}
                    </div>
                </div>
                <div class="open__pass-field-wrap">
                    <SecureInput
                        inputClass="open__pass-input"
                        name="password"
                        size={30}
                        placeholder={showOpen ? Locale.openClickToOpen : ''}
                        readonly={true}
                        tabIndex={++tabIndex}
                    />
                    <div class="open__pass-enter-btn" tabIndex={++tabIndex}>
                        <i class="fa fa-level-down-alt rotate-90 open__pass-enter-btn-icon-enter" />
                        <i class="fa fa-fingerprint open__pass-enter-btn-icon-touch-id" />
                    </div>
                    <div class="open__pass-opening-icon">
                        <i class="fa fa-spinner spin" />
                    </div>
                </div>
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
                <div class="open__last">
                    {lastOpenFiles.map((file) => (
                        <div key={file.id} class="open__last-item" tabIndex={++tabIndex}>
                            {file.path ? <kw-tip text={file.path} /> : null}
                            {file.icon ? (
                                <i class={`fa fa-${file.icon} open__last-item-icon`} />
                            ) : null}
                            <span class="open__last-item-text">{file.name}</span>
                            {canRemoveLatest ? (
                                <i class="fa fa-times open__last-item-icon-del" />
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>

            <div class="open__config-wrap" />
            <div class="open__dropzone">
                <i class="fa fa-lock muted-color open__dropzone-icon" />
                <h1 class="muted-color open__dropzone-header">{Locale.openDropHere}</h1>
            </div>
        </div>
    );
};
