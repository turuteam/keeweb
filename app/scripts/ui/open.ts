import { h, FunctionComponent } from 'preact';
import { OpenView } from 'views/open-view';
import { AppSettings } from 'models/app-settings';
import { Storage } from 'storage';
import { useState } from 'preact/hooks';
import { Launcher } from 'comp/launcher';
import { UsbListener } from 'comp/devices/usb-listener';
import { FileManager } from 'models/file-manager';
import { Workspace } from 'models/workspace';
import { Logger } from 'util/logger';

const logger = new Logger('open');

export const Open: FunctionComponent = () => {
    const [secondRowVisible, setSecondRowVisible] = useState(false);

    const storageProviders = [];

    if (AppSettings.canOpenStorage) {
        for (const prv of Object.values(Storage.getAll())) {
            if (!prv.system && prv.enabled) {
                storageProviders.push(prv);
            }
        }
    }
    storageProviders.sort((x, y) => (x.uipos || Infinity) - (y.uipos || Infinity));

    const showMore =
        storageProviders.length > 0 || AppSettings.canOpenSettings || AppSettings.canOpenGenerator;

    const showLogo =
        !showMore &&
        !AppSettings.canOpen &&
        !AppSettings.canCreate &&
        !(AppSettings.canOpenDemo && !AppSettings.demoOpened);

    const hasYubiKeys = UsbListener.attachedYubiKeys > 0;
    const showYubiKey =
        hasYubiKeys &&
        AppSettings.canOpenOtpDevice &&
        AppSettings.yubiKeyShowIcon &&
        !FileManager.getFileByName('yubikey');

    const canUseChalRespYubiKey = hasYubiKeys && AppSettings.yubiKeyShowChalResp;

    const lastOpenFiles = FileManager.fileInfos.map((fi) => {
        const storage = Storage.get(fi.storage ?? '');
        const icon = storage?.icon ?? 'file-alt';
        const path = fi.storage === 'file' || fi.storage === 'webdav' ? fi.path : undefined;
        return {
            id: fi.id,
            name: fi.name,
            path,
            icon
        };
    });

    const newClicked = () => {
        Workspace.createNewFile().catch((e) => logger.error(e));
    };

    const moreClicked = () => setSecondRowVisible(!secondRowVisible);

    const openDemoClicked = () => {
        Workspace.createDemoFile().catch((e) => logger.error(e));
    };

    return h(OpenView, {
        unlockMessage: Workspace.unlockMessage,
        secondRowVisible,
        showOpen: AppSettings.canOpen,
        showCreate: AppSettings.canCreate,
        showYubiKey,
        canUseChalRespYubiKey,
        showDemoInFirstRow: true, // AppSettings.canOpenDemo && !AppSettings.demoOpened, // TODO
        showDemoInSecondRow: AppSettings.canOpenDemo && AppSettings.demoOpened,
        showMore,
        showLogo,
        showGenerator: AppSettings.canOpenGenerator,
        showSettings: AppSettings.canOpenSettings,
        storageProviders,
        lastOpenFiles,
        canRemoveLatest: AppSettings.canRemoveLatest,
        canOpenKeyFromDropbox: !Launcher && Storage.dropbox.enabled,

        newClicked,
        moreClicked,
        openDemoClicked
    });
};
