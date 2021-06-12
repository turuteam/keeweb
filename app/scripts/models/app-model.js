import { Events } from 'framework/events';
import { Storage } from 'storage';
import { RuntimeInfo } from 'const/runtime-info';
import { UsbListener } from 'comp/app/usb-listener';
import { NativeModules } from 'comp/launcher/native-modules';
import { Timeouts } from 'const/timeouts';
import { AppSettingsModel } from 'models/app-settings-model';
import { EntryModel } from 'models/entry-model';
import { GroupModel } from 'models/group-model';
import { YubiKeyOtpModel } from 'models/otp-device/yubikey-otp-model';
import { Menu } from 'models/menu/menu-model';
import { Launcher } from 'comp/launcher';
import debounce from 'lodash/debounce';
import 'util/kdbxweb/protected-value';

class AppModel {
    tags = [];
    menu = new Menu();
    filter = {};
    sort = 'title';
    settings = AppSettingsModel;
    activeEntryId = null;
    isBeta = RuntimeInfo.beta;
    advancedSearch = null;
    attachedYubiKeysCount = 0;
    memoryPasswordStorage = {};
    fileUnlockPromise = null;
    hardwareDecryptInProgress = false;
    mainWindowBlurTimer = null;

    addFile(file) {
        file.on('change:dirty', (file, dirty) => {
            if (dirty && this.settings.autoSaveInterval === -1) {
                this.syncFile(file);
            }
        });

        Events.emit('file-opened');

        if (this.fileUnlockPromise) {
            this.appLogger.info('Running pending file unlock operation');
            this.fileUnlockPromise.resolve(file);
            this.fileUnlockPromise = null;
            Events.emit('unlock-message-changed', null);
        }
    }

    getFirstSelectedGroupForCreation() {
        const selGroupId = this.filter.group;
        let file, group;
        if (selGroupId) {
            this.files.some((f) => {
                file = f;
                group = f.getGroup(selGroupId);
                return group;
            });
        }
        if (!group) {
            file = this.files.find((f) => f.active && !f.readOnly);
            group = file.groups[0];
        }
        return { group, file };
    }

    completeUserNames(part) {
        const userNames = {};
        this.files.forEach((file) => {
            file.forEachEntry(
                { text: part, textLower: part.toLowerCase(), advanced: { user: true } },
                (entry) => {
                    const userName = entry.user;
                    if (userName) {
                        userNames[userName] = (userNames[userName] || 0) + 1;
                    }
                }
            );
        });
        const matches = Object.entries(userNames);
        matches.sort((x, y) => y[1] - x[1]);
        const maxResults = 5;
        if (matches.length > maxResults) {
            matches.length = maxResults;
        }
        return matches.map((m) => m[0]);
    }

    createNewEntry(args) {
        const sel = this.getFirstSelectedGroupForCreation();
        if (args?.template) {
            if (sel.file !== args.template.file) {
                sel.file = args.template.file;
                sel.group = args.template.file.groups[0];
            }
            const templateEntry = args.template.entry;
            const newEntry = EntryModel.newEntry(sel.group, sel.file);
            newEntry.copyFromTemplate(templateEntry);
            return newEntry;
        } else {
            return EntryModel.newEntry(sel.group, sel.file, {
                tag: this.filter.tag
            });
        }
    }

    createNewEntryWithFields(group, fields) {
        return EntryModel.newEntryWithFields(group, fields);
    }

    createNewGroup() {
        const sel = this.getFirstSelectedGroupForCreation();
        return GroupModel.newGroup(sel.group, sel.file);
    }

    createNewGroupWithName(group, file, name) {
        const newGroup = GroupModel.newGroup(group, file);
        newGroup.setName(name);
        return newGroup;
    }

    createNewTemplateEntry() {
        const file = this.getFirstSelectedGroupForCreation().file;
        const group = file.getEntryTemplatesGroup() || file.createEntryTemplatesGroup();
        return EntryModel.newEntry(group, file);
    }

    getStoreOpts(file) {
        const opts = file.opts;
        const storage = file.storage;
        if (Storage[storage] && Storage[storage].fileOptsToStoreOpts && opts) {
            return Storage[storage].fileOptsToStoreOpts(opts, file);
        }
        return null;
    }

    setFileOpts(file, opts) {
        const storage = file.storage;
        if (Storage[storage] && Storage[storage].storeOptsToFileOpts && opts) {
            file.opts = Storage[storage].storeOptsToFileOpts(opts, file);
        }
    }

    fileOpened(file, data, params) {
        if (file.storage === 'file') {
            Storage.file.watch(
                file.path,
                debounce(() => {
                    this.syncFile(file);
                }, Timeouts.FileChangeSync)
            );
        }
        if (file.isKeyChangePending(true)) {
            Events.emit('key-change-pending', { file });
        }
        const backup = file.backup;
        if (data && backup && backup.enabled && backup.pending) {
            this.scheduleBackupFile(file, data);
        }
        if (this.settings.yubiKeyAutoOpen) {
            if (
                this.attachedYubiKeysCount > 0 &&
                !this.files.some((f) => f.backend === 'otp-device')
            ) {
                this.tryOpenOtpDeviceInBackground();
            }
        }
        if (this.settings.deviceOwnerAuth) {
            this.saveEncryptedPassword(file, params);
        }
    }

    removeFileInfo(id) {
        Storage.cache.remove(id);
        this.fileInfos.remove(id);
        this.fileInfos.save();
    }

    getFileInfo(file) {
        return (
            this.fileInfos.get(file.id) ||
            this.fileInfos.getMatch(file.storage, file.name, file.path)
        );
    }

    deleteAllCachedFiles() {
        for (const fileInfo of this.fileInfos) {
            if (fileInfo.storage && !fileInfo.modified) {
                Storage.cache.remove(fileInfo.id);
            }
        }
    }

    clearStoredKeyFiles() {
        for (const fileInfo of this.fileInfos) {
            fileInfo.set({
                keyFileName: null,
                keyFilePath: null,
                keyFileHash: null
            });
        }
        this.fileInfos.save();
    }

    unsetKeyFile(fileId) {
        const fileInfo = this.fileInfos.get(fileId);
        fileInfo.set({
            keyFileName: null,
            keyFilePath: null,
            keyFileHash: null
        });
        this.fileInfos.save();
    }

    usbDevicesChanged() {
        const attachedYubiKeysCount = this.attachedYubiKeysCount;

        this.attachedYubiKeysCount = UsbListener.attachedYubiKeys;

        if (!this.settings.yubiKeyAutoOpen) {
            return;
        }

        const isNewYubiKey = UsbListener.attachedYubiKeys > attachedYubiKeysCount;
        const hasOpenFiles = this.files.some(
            (file) => file.active && file.backend !== 'otp-device'
        );

        if (isNewYubiKey && hasOpenFiles && !this.openingOtpDevice) {
            this.tryOpenOtpDeviceInBackground();
        }
    }

    tryOpenOtpDeviceInBackground() {
        this.applogger.info('Auto-opening a YubiKey');
        this.openOtpDevice((err) => {
            this.applogger.info('YubiKey auto-open complete', err);
        });
    }

    openOtpDevice(callback) {
        this.openingOtpDevice = true;
        const device = new YubiKeyOtpModel();
        device.open((err) => {
            this.openingOtpDevice = false;
            if (!err) {
                this.addFile(device);
            }
            callback(err);
        });
        return device;
    }

    getMatchingOtpEntry(entry) {
        if (!this.settings.yubiKeyMatchEntries) {
            return null;
        }
        for (const file of this.files) {
            if (file.backend === 'otp-device') {
                const matchingEntry = file.getMatchingEntry(entry);
                if (matchingEntry) {
                    return matchingEntry;
                }
            }
        }
    }

    saveEncryptedPassword(file, params) {
        if (!this.settings.deviceOwnerAuth || params.encryptedPassword) {
            return;
        }
        NativeModules.hardwareEncrypt(params.password)
            .then((encryptedPassword) => {
                encryptedPassword = encryptedPassword.toBase64();
                const fileInfo = this.fileInfos.get(file.id);
                const encryptedPasswordDate = new Date();
                file.encryptedPassword = encryptedPassword;
                file.encryptedPasswordDate = encryptedPasswordDate;
                if (this.settings.deviceOwnerAuth === 'file') {
                    fileInfo.encryptedPassword = encryptedPassword;
                    fileInfo.encryptedPasswordDate = encryptedPasswordDate;
                    this.fileInfos.save();
                } else if (this.settings.deviceOwnerAuth === 'memory') {
                    this.memoryPasswordStorage[file.id] = {
                        value: encryptedPassword,
                        date: encryptedPasswordDate
                    };
                }
            })
            .catch((e) => {
                file.encryptedPassword = null;
                file.encryptedPasswordDate = null;
                delete this.memoryPasswordStorage[file.id];
                this.appLogger.error('Error encrypting password', e);
            });
    }

    getMemoryPassword(fileId) {
        return this.memoryPasswordStorage[fileId];
    }

    checkEncryptedPasswordsStorage() {
        if (this.settings.deviceOwnerAuth === 'file') {
            let changed = false;
            for (const fileInfo of this.fileInfos) {
                if (this.memoryPasswordStorage[fileInfo.id]) {
                    fileInfo.encryptedPassword = this.memoryPasswordStorage[fileInfo.id].value;
                    fileInfo.encryptedPasswordDate = this.memoryPasswordStorage[fileInfo.id].date;
                    changed = true;
                }
            }
            if (changed) {
                this.fileInfos.save();
            }
            for (const file of this.files) {
                if (this.memoryPasswordStorage[file.id]) {
                    file.encryptedPassword = this.memoryPasswordStorage[file.id].value;
                    file.encryptedPasswordDate = this.memoryPasswordStorage[file.id].date;
                }
            }
        } else if (this.settings.deviceOwnerAuth === 'memory') {
            let changed = false;
            for (const fileInfo of this.fileInfos) {
                if (fileInfo.encryptedPassword) {
                    this.memoryPasswordStorage[fileInfo.id] = {
                        value: fileInfo.encryptedPassword,
                        date: fileInfo.encryptedPasswordDate
                    };
                    fileInfo.encryptedPassword = null;
                    fileInfo.encryptedPasswordDate = null;
                    changed = true;
                }
            }
            if (changed) {
                this.fileInfos.save();
            }
        } else {
            let changed = false;
            for (const fileInfo of this.fileInfos) {
                if (fileInfo.encryptedPassword) {
                    fileInfo.encryptedPassword = null;
                    fileInfo.encryptedPasswordDate = null;
                    changed = true;
                }
            }
            if (changed) {
                this.fileInfos.save();
            }
            for (const file of this.files) {
                if (file.encryptedPassword) {
                    file.encryptedPassword = null;
                    file.encryptedPasswordDate = null;
                }
            }
            this.memoryPasswordStorage = {};
        }
    }

    unlockAnyFile(unlockRes, timeout) {
        this.rejectPendingFileUnlockPromise('Replaced with a new operation');
        Events.emit('show-open-view');
        return new Promise((resolve, reject) => {
            this.fileUnlockPromise = { resolve, reject, unlockRes };
            if (timeout) {
                const timer = setTimeout(
                    () => this.rejectPendingFileUnlockPromise('Timeout'),
                    timeout
                );
                this.fileUnlockPromise.resolve = (res) => {
                    clearTimeout(timer);
                    resolve(res);
                };
                this.fileUnlockPromise.reject = (err) => {
                    clearTimeout(timer);
                    reject(err);
                };
            }
            this.appLogger.info('Pending file unlock operation is set');
            Events.emit('unlock-message-changed', unlockRes);
        });
    }

    get unlockMessageRes() {
        return this.fileUnlockPromise?.unlockRes;
    }

    rejectPendingFileUnlockPromise(reason) {
        if (this.fileUnlockPromise) {
            this.appLogger.info('Cancel pending file unlock operation', reason);
            this.fileUnlockPromise.reject(new Error(reason));
            this.fileUnlockPromise = null;
            Events.emit('unlock-message-changed', null);
        }
    }

    mainWindowBlur() {
        if (!this.hardwareDecryptInProgress) {
            this.mainWindowBlurTimer = setTimeout(() => {
                // macOS emits focus-blur-focus event in a row when triggering auto-type from minimized state
                delete this.mainWindowBlurTimer;
                this.rejectPendingFileUnlockPromise('Main window blur');
            }, Timeouts.AutoTypeWindowFocusAfterBlur);
        }
    }

    mainWindowFocus() {
        if (this.mainWindowBlurTimer) {
            clearTimeout(this.mainWindowBlurTimer);
            this.mainWindowBlurTimer = null;
        }
    }

    mainWindowWillClose() {
        this.rejectPendingFileUnlockPromise('Main window will close');
    }

    hardwareDecryptStarted() {
        this.hardwareDecryptInProgress = true;
    }

    hardwareDecryptFinished() {
        this.hardwareDecryptInProgress = false;
        if (!Launcher.isAppFocused()) {
            this.rejectPendingFileUnlockPromise('App is not focused after hardware decrypt');
        }
    }
}

export { AppModel };
