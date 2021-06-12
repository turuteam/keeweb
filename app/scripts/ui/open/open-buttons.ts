import { h, FunctionComponent } from 'preact';
import { OpenButtonsView } from 'views/open/open-buttons-view';
import { AppSettings } from 'models/app-settings';
import { Storage } from 'storage';
import { UsbListener } from 'comp/devices/usb-listener';
import { FileManager } from 'models/file-manager';
import { Workspace } from 'models/workspace';
import { Logger } from 'util/logger';
import { useModelField } from 'util/ui/hooks';
import { OpenController } from 'comp/app/open-controller';
import { OpenState } from 'models/open-state';
import { GeneratorState } from 'models/generator-state';

const logger = new Logger('open');

export const OpenButtons: FunctionComponent = () => {
    const secondRowVisible = useModelField(OpenState, 'secondRowVisible');

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

    const openClicked = () => {
        OpenController.chooseFile();
    };

    const newClicked = () => {
        Workspace.createNewFile().catch((e) => logger.error(e));
    };

    const moreClicked = () => {
        OpenState.secondRowVisible = !secondRowVisible;
    };

    const openDemoClicked = () => {
        Workspace.createDemoFile().catch((e) => logger.error(e));
    };

    const settingsClicked = () => {
        Workspace.showSettings();
    };

    const generateClicked = (rect: DOMRect) => {
        if (GeneratorState.visible) {
            GeneratorState.hide();
        } else {
            GeneratorState.show({ top: rect.top, left: rect.left });
        }
    };

    return h(OpenButtonsView, {
        secondRowVisible,
        showOpen: AppSettings.canOpen,
        showCreate: AppSettings.canCreate,
        showYubiKey,
        showDemoInFirstRow: AppSettings.canOpenDemo && !AppSettings.demoOpened,
        showDemoInSecondRow: AppSettings.canOpenDemo && AppSettings.demoOpened,
        showMore,
        showLogo,
        showGenerator: AppSettings.canOpenGenerator,
        showSettings: AppSettings.canOpenSettings,
        storageProviders,

        openClicked,
        newClicked,
        moreClicked,
        openDemoClicked,
        settingsClicked,
        generateClicked
    });
};
