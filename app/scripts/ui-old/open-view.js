import * as kdbxweb from 'kdbxweb';
import { View } from 'framework/views/view';
import { Events } from 'framework/events';
import { Storage } from 'storage';
import { Alerts } from 'comp/ui/alerts';
import { UsbListener } from 'comp/app/usb-listener';
import { YubiKey } from 'comp/app/yubikey';
import { Comparators } from 'util/data/comparators';
import { Features } from 'util/features';
import { UrlFormat } from 'util/formatting/url-format';
import { Locale } from 'util/locale';
import { Logger } from 'util/logger';
import { InputFx } from 'util/ui/input-fx';
import { OpenConfigView } from 'views/open-config-view';
import { StorageFileListView } from 'views/storage-file-list-view';
import { OpenChalRespView } from 'views/open-chal-resp-view';
import { omit } from 'util/fn';
import { GeneratorView } from 'views/generator-view';
import { NativeModules } from 'comp/launcher/native-modules';

const logger = new Logger('open-view');

class OpenView extends View {
    windowFocused() {
        this.inputEl.focus();
        this.checkIfEncryptedPasswordDateIsValid();
    }

    showLocalFileAlert() {
        if (this.model.settings.skipOpenLocalWarn) {
            return;
        }
        Alerts.alert({
            header: Locale.openLocalFile,
            body: Locale.openLocalFileBody,
            icon: 'file-alt',
            buttons: [
                { result: 'skip', title: Locale.openLocalFileDontShow, error: true },
                { result: 'ok', title: Locale.alertOk }
            ],
            click: '',
            esc: '',
            enter: '',
            success: (res) => {
                this.focusInput();
                if (res === 'skip') {
                    this.model.settings.skipOpenLocalWarn = true;
                }
            }
        });
    }

    fileSelected(e) {
        const file = e.target.files[0];
        if (file) {
            if (this.model.settings.canImportCsv && /\.csv$/.test(file.name)) {
                Events.emit('import-csv-requested', file);
            } else if (this.model.settings.canImportXml && /\.xml$/.test(file.name)) {
                this.setFile(file, null, this.showLocalFileAlert.bind(this));
            } else {
                this.processFile(file, (success) => {
                    if (success && !file.path && this.reading === 'fileData') {
                        this.showLocalFileAlert();
                    }
                });
            }
        }
    }

    displayOpenChalResp() {
        this.$el
            .find('.open__settings-yubikey')
            .toggleClass('open__settings-yubikey--active', !!this.params.chalResp);
    }

    displayOpenDeviceOwnerAuth() {
        const available = !!this.encryptedPassword;
        const passEmpty = !this.passwordInput.length;
        const canUseEncryptedPassword = available && passEmpty;
        this.el
            .querySelector('.open__pass-enter-btn')
            .classList.toggle('open__pass-enter-btn--touch-id', canUseEncryptedPassword);
    }

    openLast(e) {
        if (this.busy) {
            return;
        }
        const id = $(e.target).closest('.open__last-item').data('id').toString();
        if ($(e.target).is('.open__last-item-icon-del')) {
            const fileInfo = this.model.fileInfos.get(id);
            if (!fileInfo.storage || fileInfo.modified) {
                Alerts.yesno({
                    header: Locale.openRemoveLastQuestion,
                    body: fileInfo.modified
                        ? Locale.openRemoveLastQuestionModBody
                        : Locale.openRemoveLastQuestionBody,
                    buttons: [
                        { result: 'yes', title: Locale.alertYes },
                        { result: '', title: Locale.alertNo }
                    ],
                    success: () => {
                        this.removeFile(id);
                    }
                });
                return;
            }
            this.removeFile(id);
            return;
        }

        const fileInfo = this.model.fileInfos.get(id);
        this.showOpenFileInfo(fileInfo, true);
    }

    removeFile(id) {
        this.model.removeFileInfo(id);
        this.$el.find('.open__last-item[data-id="' + id + '"]').remove();
        this.resetParams();
        this.render();
    }

    inputInput() {
        this.displayOpenDeviceOwnerAuth();
    }

    openDb() {
        if (this.params.id && this.model.files.get(this.params.id)) {
            this.emit('close');
            return;
        }
        if (this.busy || !this.params.name) {
            return;
        }
        this.$el.toggleClass('open--opening', true);
        this.inputEl.attr('disabled', 'disabled');
        this.busy = true;
        this.params.password = this.passwordInput.value;
        if (this.encryptedPassword && !this.params.password.length) {
            logger.info('Encrypting password using hardware decryption');
            const touchIdPrompt = Locale.bioOpenAuthPrompt.replace('{}', this.params.name);
            const encryptedPassword = kdbxweb.ProtectedValue.fromBase64(
                this.encryptedPassword.value
            );
            Events.emit('hardware-decrypt-started');
            NativeModules.hardwareDecrypt(encryptedPassword, touchIdPrompt)
                .then((password) => {
                    Events.emit('hardware-decrypt-finished');

                    this.params.password = password;
                    this.params.encryptedPassword = this.encryptedPassword;
                    this.model.openFile(this.params, (err) => this.openDbComplete(err));
                })
                .catch((err) => {
                    Events.emit('hardware-decrypt-finished');

                    if (err.message.includes('User refused')) {
                        err.userCanceled = true;
                    } else if (err.message.includes('SecKeyCreateDecryptedData')) {
                        err.maybeTouchIdChanged = true;
                    }
                    logger.error('Error in hardware decryption', err);
                    this.openDbComplete(err);
                });
        } else {
            this.params.encryptedPassword = null;
            this.afterPaint(() => {
                this.model.openFile(this.params, (err) => this.openDbComplete(err));
            });
        }
    }

    openDbComplete(err) {
        this.busy = false;
        this.$el.toggleClass('open--opening', false);
        const showInputError = err && !err.userCanceled;
        this.inputEl.removeAttr('disabled').toggleClass('input--error', !!showInputError);
        if (err) {
            logger.error('Error opening file', err);
            this.focusInput(true);
            this.inputEl[0].selectionStart = 0;
            this.inputEl[0].selectionEnd = this.inputEl.val().length;
            if (err.code === 'InvalidKey') {
                InputFx.shake(this.inputEl);
            } else if (err.userCanceled) {
                // nothing to do
            } else {
                if (err.notFound) {
                    err = Locale.openErrorFileNotFound;
                }
                let alertBody = Locale.openErrorDescription;
                if (err.maybeTouchIdChanged) {
                    alertBody += '\n' + Locale.openErrorDescriptionMaybeTouchIdChanged;
                }
                Alerts.error({
                    header: Locale.openError,
                    body: alertBody,
                    pre: this.errorToString(err)
                });
            }
        } else {
            this.emit('close');
        }
    }

    importDbWithXml() {
        if (this.busy || !this.params.name) {
            return;
        }
        this.$el.toggleClass('open--opening', true);
        this.inputEl.attr('disabled', 'disabled');
        this.busy = true;
        this.afterPaint(() =>
            this.model.importFileWithXml(this.params, (err) => {
                if (err) {
                    this.params.name = '';
                    this.params.fileXml = null;
                }
                this.openDbComplete(err);
            })
        );
    }

    openStorage(e) {
        if (this.busy) {
            return;
        }
        const storage = Storage[$(e.target).closest('.open__icon').data('storage')];
        if (!storage) {
            return;
        }
        if (storage.needShowOpenConfig && storage.needShowOpenConfig()) {
            this.showConfig(storage);
        } else if (storage.list) {
            this.listStorage(storage);
        } else {
            Alerts.notImplemented();
        }
    }

    listStorage(storage, config) {
        if (this.busy) {
            return;
        }
        this.closeConfig();
        const icon = this.$el.find('.open__icon-storage[data-storage=' + storage.name + ']');
        this.busy = true;
        icon.toggleClass('flip3d', true);
        storage.list(config && config.dir, (err, files) => {
            icon.toggleClass('flip3d', false);
            this.busy = false;
            if (err || !files) {
                err = err ? err.toString() : '';
                if (err === 'browser-auth-started') {
                    return;
                }
                if (err.lastIndexOf('OAuth', 0) !== 0 && !Alerts.alertDisplayed) {
                    Alerts.error({
                        header: Locale.openError,
                        body: Locale.openListErrorBody,
                        pre: err.toString()
                    });
                }
                return;
            }
            if (!files.length) {
                Alerts.error({
                    header: Locale.openNothingFound,
                    body: Locale.openNothingFoundBody
                });
                return;
            }

            const fileNameComparator = Comparators.stringComparator('path', true);
            files.sort((x, y) => {
                if (x.dir !== y.dir) {
                    return !!y.dir - !!x.dir;
                }
                return fileNameComparator(x, y);
            });
            if (config && config.dir) {
                files.unshift({
                    path: config.prevDir,
                    name: '..',
                    dir: true
                });
            }
            const listView = new StorageFileListView({ files });
            listView.on('selected', (file) => {
                if (file.dir) {
                    this.listStorage(storage, {
                        dir: file.path,
                        prevDir: (config && config.dir) || ''
                    });
                } else {
                    this.openStorageFile(storage, file);
                }
            });
            Alerts.alert({
                header: Locale.openSelectFile,
                body: Locale.openSelectFileBody,
                icon: storage.icon || 'file-alt',
                buttons: [{ result: '', title: Locale.alertCancel }],
                esc: '',
                click: '',
                view: listView
            });
        });
    }

    openStorageFile(storage, file) {
        if (this.busy) {
            return;
        }
        this.params.id = null;
        this.params.storage = storage.name;
        this.params.path = file.path;
        this.params.name = UrlFormat.getDataFileName(file.name);
        this.params.rev = file.rev;
        this.params.fileData = null;
        this.encryptedPassword = null;
        this.displayOpenFile();
        this.displayOpenDeviceOwnerAuth();
    }

    showConfig(storage) {
        if (this.busy) {
            return;
        }
        if (this.views.openConfig) {
            this.views.openConfig.remove();
        }
        const config = {
            id: storage.name,
            name: Locale[storage.name] || storage.name,
            icon: storage.icon,
            buttons: true,
            ...storage.getOpenConfig()
        };
        this.views.openConfig = new OpenConfigView(config, {
            parent: '.open__config-wrap'
        });
        this.views.openConfig.on('cancel', this.closeConfig.bind(this));
        this.views.openConfig.on('apply', this.applyConfig.bind(this));
        this.views.openConfig.render();
        this.$el.find('.open__pass-area').addClass('hide');
        this.$el.find('.open__icons--lower').addClass('hide');
    }

    closeConfig() {
        if (this.busy) {
            this.storageWaitId = null;
            this.busy = false;
        }
        if (this.views.openConfig) {
            this.views.openConfig.remove();
            delete this.views.openConfig;
        }
        this.$el.find('.open__pass-area').removeClass('hide');
        this.$el.find('.open__config').addClass('hide');
        this.focusInput();
    }

    applyConfig(config) {
        if (this.busy || !config) {
            return;
        }
        this.busy = true;
        this.views.openConfig.setDisabled(true);
        const storage = Storage[config.storage];
        this.storageWaitId = Math.random();
        const path = config.path;
        const opts = omit(config, ['path', 'storage']);
        const req = {
            waitId: this.storageWaitId,
            storage: config.storage,
            path,
            opts
        };
        if (storage.applyConfig) {
            storage.applyConfig(opts, this.storageApplyConfigComplete.bind(this, req));
        } else {
            storage.stat(path, opts, this.storageStatComplete.bind(this, req));
        }
    }

    storageApplyConfigComplete(req, err) {
        if (this.storageWaitId !== req.waitId) {
            return;
        }
        this.storageWaitId = null;
        this.busy = false;
        if (err) {
            this.views.openConfig.setDisabled(false);
            this.views.openConfig.setError(err);
        } else {
            this.closeConfig();
        }
    }

    storageStatComplete(req, err, stat) {
        if (this.storageWaitId !== req.waitId) {
            return;
        }
        this.storageWaitId = null;
        this.busy = false;
        if (err) {
            this.views.openConfig.setDisabled(false);
            this.views.openConfig.setError(err);
        } else {
            this.closeConfig();
            this.params.id = null;
            this.params.storage = req.storage;
            this.params.path = req.path;
            this.params.opts = req.opts;
            this.params.name = UrlFormat.getDataFileName(req.path);
            this.params.rev = stat.rev;
            this.params.fileData = null;
            this.encryptedPassword = null;
            this.displayOpenFile();
            this.displayOpenDeviceOwnerAuth();
        }
    }

    toggleGenerator(e) {
        e.stopPropagation();
        if (this.views.gen) {
            this.views.gen.remove();
            return;
        }
        const el = this.$el.find('.open__icon-generate');
        const rect = el[0].getBoundingClientRect();
        const pos = {
            left: rect.left,
            top: rect.top
        };
        if (Features.isMobile) {
            pos.left = '50vw';
            pos.top = '50vh';
            pos.transform = 'translate(-50%, -50%)';
        }
        const generator = new GeneratorView({
            copy: true,
            noTemplateEditor: true,
            pos
        });
        generator.render();
        generator.once('remove', () => {
            delete this.views.gen;
        });
        this.views.gen = generator;
    }

    usbDevicesChanged() {
        if (this.model.settings.canOpenOtpDevice) {
            const hasYubiKeys = !!UsbListener.attachedYubiKeys;

            const showOpenIcon = hasYubiKeys && this.model.settings.yubiKeyShowIcon;
            this.$el.find('.open__icon-yubikey').toggleClass('hide', !showOpenIcon);

            const showChallengeResponseIcon =
                hasYubiKeys && this.model.settings.yubiKeyShowChalResp;
            this.$el
                .find('.open__settings-yubikey')
                .toggleClass('open__settings-yubikey--present', !!showChallengeResponseIcon);

            if (!hasYubiKeys && this.busy && this.otpDevice) {
                this.otpDevice.cancelOpen();
            }
        }
    }

    openYubiKey() {
        if (this.busy && this.otpDevice) {
            this.otpDevice.cancelOpen();
        }
        if (!this.busy) {
            this.busy = true;
            this.inputEl.attr('disabled', 'disabled');
            const icon = this.$el.find('.open__icon-yubikey');
            icon.toggleClass('flip3d', true);

            YubiKey.checkToolStatus().then((status) => {
                if (status !== 'ok') {
                    icon.toggleClass('flip3d', false);
                    this.inputEl.removeAttr('disabled');
                    this.busy = false;
                    return Events.emit('toggle-settings', 'devices');
                }
                this.otpDevice = this.model.openOtpDevice((err) => {
                    if (err && !YubiKey.aborted) {
                        Alerts.error({
                            header: Locale.openError,
                            body: Locale.openErrorDescription,
                            pre: this.errorToString(err)
                        });
                    }
                    this.otpDevice = null;
                    icon.toggleClass('flip3d', false);
                    this.inputEl.removeAttr('disabled');
                    this.busy = false;
                });
            });
        }
    }

    selectYubiKeyChalResp() {
        if (this.busy) {
            return;
        }

        if (this.params.chalResp) {
            this.params.chalResp = null;
            this.el
                .querySelector('.open__settings-yubikey')
                .classList.remove('open__settings-yubikey--active');
            this.focusInput();
            return;
        }

        const chalRespView = new OpenChalRespView();
        chalRespView.on('select', ({ vid, pid, serial, slot }) => {
            this.params.chalResp = { vid, pid, serial, slot };
            this.el
                .querySelector('.open__settings-yubikey')
                .classList.add('open__settings-yubikey--active');
            this.focusInput();
        });

        Alerts.alert({
            header: Locale.openChalRespHeader,
            icon: 'usb-token',
            buttons: [{ result: '', title: Locale.alertCancel }],
            esc: '',
            click: '',
            view: chalRespView
        });
    }

    errorToString(err) {
        const str = err.toString();
        if (str !== {}.toString()) {
            return str;
        }
        if (err.ykError && err.code) {
            return Locale.yubiKeyErrorWithCode.replace('{}', err.code);
        }
        return undefined;
    }

    setEncryptedPassword(fileInfo) {
        this.encryptedPassword = null;
        if (!fileInfo.id) {
            return;
        }
        switch (this.model.settings.deviceOwnerAuth) {
            case 'memory':
                this.encryptedPassword = this.model.getMemoryPassword(fileInfo.id);
                break;
            case 'file':
                this.encryptedPassword = {
                    value: fileInfo.encryptedPassword,
                    date: fileInfo.encryptedPasswordDate
                };
                break;
        }
        this.checkIfEncryptedPasswordDateIsValid();
    }

    checkIfEncryptedPasswordDateIsValid() {
        if (this.encryptedPassword) {
            const maxDate = new Date(this.encryptedPassword.date);
            maxDate.setMinutes(
                maxDate.getMinutes() + this.model.settings.deviceOwnerAuthTimeoutMinutes
            );
            if (maxDate < new Date()) {
                this.encryptedPassword = null;
            }
        }
    }

    openMessageCancelClick() {
        this.model.rejectPendingFileUnlockPromise('User canceled');
    }
}

export { OpenView };
