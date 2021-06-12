import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { useRef } from 'preact/hooks';
import { withoutPropagation } from 'util/ui/events';

interface StorageProvider {
    name: string;
    icon?: string;
}

export const OpenButtonsView: FunctionComponent<{
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

    openClicked: () => void;
    moreClicked: () => void;
    newClicked: () => void;
    openDemoClicked: () => void;
    settingsClicked: () => void;
    generateClicked: (rect: DOMRect) => void;
}> = ({
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

    openClicked,
    moreClicked,
    newClicked,
    openDemoClicked,
    settingsClicked,
    generateClicked
}) => {
    let tabIndex = 100;

    const generateButton = useRef<HTMLDivElement>();

    return (
        <>
            <div class="open__icons">
                {showOpen ? (
                    <div
                        class="open__icon open__icon-open"
                        tabIndex={++tabIndex}
                        onClick={openClicked}
                    >
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
                        <div
                            class="open__icon open__icon-generate"
                            tabIndex={++tabIndex}
                            ref={generateButton}
                            onClick={withoutPropagation(() =>
                                generateClicked(generateButton.current.getBoundingClientRect())
                            )}
                        >
                            <i class="fa fa-bolt open__icon-i" />
                            <div class="open__icon-text">{Locale.openGenerate}</div>
                        </div>
                    ) : null}
                    {showSettings ? (
                        <div
                            class="open__icon open__icon-settings"
                            tabIndex={++tabIndex}
                            onClick={settingsClicked}
                        >
                            <i class="fa fa-cog open__icon-i" />
                            <div class="open__icon-text">{Locale.settings}</div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </>
    );
};
