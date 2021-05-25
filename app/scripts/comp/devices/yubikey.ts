import { Events } from 'util/events';
import { Launcher } from 'comp/launcher';
import { NativeModules } from 'comp/launcher/native-modules';
import { Logger } from 'util/logger';
import { UsbListener } from 'comp/devices/usb-listener';
import { AppSettings } from 'models/app-settings';
import { Timeouts } from 'const/timeouts';
import { YubiKeyProductIds, YubiKeyChallengeSize } from 'const/hardware';
import { Locale } from 'util/locale';
import * as fs from 'fs';
import { YubiKeyInfo } from 'comp/launcher/desktop-ipc';
import { FileChalRespConfig } from 'models/file-info';

const logger = new Logger('yubikey');
let cmd: string | undefined;

type ToolStatus = 'unknown' | 'ok' | 'checking' | 'error';

const YkmanProcessName = 'ykman';

export interface YubiKeyInfoWithName extends YubiKeyInfo {
    fullName: string;
}

export interface ShortYubiKeyInfo {
    fullName: string;
    serial: string;
}

export interface YubiKeyOtpCodeInfo {
    title: string;
    user: string;
    needsTouch: boolean;
}

const YubiKey = {
    ykmanStatus: 'unknown' as ToolStatus,
    processIsRunning: false,
    aborted: false,

    async cmd(): Promise<string> {
        if (cmd) {
            return cmd;
        }
        const macYkmanPath = '/usr/local/bin/ykman';
        if (process.platform === 'darwin') {
            try {
                await fs.promises.access(macYkmanPath);
                cmd = macYkmanPath;
                return cmd;
            } catch (err) {}
        }
        cmd = 'ykman';
        return cmd;
    },

    async checkToolStatus(): Promise<ToolStatus> {
        if (this.ykmanStatus === 'ok') {
            return Promise.resolve(this.ykmanStatus);
        }
        this.ykmanStatus = 'checking';
        cmd = undefined;

        try {
            await Launcher?.spawn({
                cmd: await this.cmd(),
                args: ['-v'],
                noStdOutLogging: true
            });
            this.ykmanStatus = 'ok';
        } catch {
            this.ykmanStatus = 'error';
        }
        return this.ykmanStatus;
    },

    abort(): void {
        logger.info('Aborting');
        if (this.processIsRunning) {
            logger.info('Killing the process');
            try {
                Launcher?.killProcess(YkmanProcessName);
            } catch {}
        }
        this.aborted = true;
        this.processIsRunning = false;
    },

    async list(): Promise<YubiKeyInfoWithName[]> {
        const yubiKeys = await NativeModules.getYubiKeys();
        return yubiKeys.map((yk) => ({
            ...yk,
            fullName: this.getKeyFullName(yk)
        }));
    },

    getKeyFullName(yk: YubiKeyInfo): string {
        let name = 'YubiKey';
        if (YubiKeyProductIds.Gen1.includes(yk.pid)) {
            name += ' Gen 1';
        } else if (YubiKeyProductIds.NEO.includes(yk.pid)) {
            name += ' NEO';
        } else if (YubiKeyProductIds.YK4.includes(yk.pid)) {
            if (yk.version >= '5.1.0') {
                name += ' 5';
            }
        }
        return `${name} ${yk.serial}`;
    },

    listWithYkman(): Promise<ShortYubiKeyInfo[]> {
        return this.listWithYkmanInternal(true);
    },

    async listWithYkmanInternal(canRetry: boolean): Promise<ShortYubiKeyInfo[]> {
        if (this.processIsRunning) {
            throw new Error('Already in progress');
        }
        this.aborted = false;

        logger.info('Listing YubiKeys');

        if (!UsbListener.attachedYubiKeys) {
            return Promise.resolve([]);
        }

        this.processIsRunning = true;
        let stdout;
        try {
            const res = await Launcher?.spawn({
                cmd: await this.cmd(),
                args: ['list'],
                noStdOutLogging: true,
                name: YkmanProcessName
            });
            stdout = res?.stdout ?? '';
        } catch (err) {
            if (this.aborted) {
                throw new Error('Aborted');
            }
            throw err;
        } finally {
            this.processIsRunning = false;
        }

        const yubiKeysIncludingEmpty: ShortYubiKeyInfo[] = stdout
            .trim()
            .split(/\n/g)
            .map((line) => {
                const fullName = line;
                const serial = (line.match(/\d{5,}$/g) || [])[0];
                return { fullName, serial };
            });

        const yubiKeys = yubiKeysIncludingEmpty.filter((s) => s.serial);

        if (
            yubiKeysIncludingEmpty.length === 1 &&
            yubiKeys.length === 0 &&
            stdout.startsWith('YubiKey') &&
            stdout.includes('CCID') &&
            !stdout.includes('Serial')
        ) {
            logger.info('The YubiKey is probably stuck');
            if (!AppSettings.yubiKeyStuckWorkaround) {
                throw new Error(Locale.yubiKeyStuckError);
            }
            if (canRetry) {
                return this.repairStuckYubiKey();
            }
        }

        if (!yubiKeys.length) {
            throw new Error('No YubiKeys returned by "ykman list"');
        }

        return yubiKeys;
    },

    async repairStuckYubiKey(): Promise<ShortYubiKeyInfo[]> {
        logger.info('Repairing a stuck YubiKey');

        let result: Promise<ShortYubiKeyInfo[]> | undefined;

        let openTimeout = 0;
        const countYubiKeys = UsbListener.attachedYubiKeys;
        const onDevicesChangedDuringRepair = () => {
            if (UsbListener.attachedYubiKeys === countYubiKeys) {
                logger.info('YubiKey was reconnected');
                Events.off('usb-devices-changed', onDevicesChangedDuringRepair);
                clearTimeout(openTimeout);
                this.aborted = false;
                result = new Promise<ShortYubiKeyInfo[]>((resolve) => {
                    setTimeout(() => {
                        resolve(this.listWithYkmanInternal(false));
                    }, Timeouts.ExternalDeviceAfterReconnect);
                });
            }
        };
        Events.on('usb-devices-changed', onDevicesChangedDuringRepair);

        try {
            await Launcher?.spawn({
                cmd: await this.cmd(),
                args: ['config', 'usb', '-e', 'oath', '-f'],
                noStdOutLogging: true
            });
        } catch (err) {
            logger.info('Repair complete with error', err);
            Events.off('usb-devices-changed', onDevicesChangedDuringRepair);
            throw new Error('YubiKey repair error');
        }

        logger.info('Repair complete OK');
        openTimeout = window.setTimeout(() => {
            Events.off('usb-devices-changed', onDevicesChangedDuringRepair);
        }, Timeouts.ExternalDeviceReconnect);

        if (!result) {
            throw new Error('YubiKeys not changed during repair');
        }

        return result;
    },

    async getOtpCodes(serial: number): Promise<YubiKeyOtpCodeInfo[]> {
        if (this.processIsRunning) {
            throw new Error('Already in progress');
        }
        this.aborted = false;

        let stdout: string;

        this.processIsRunning = true;
        try {
            const res = await Launcher?.spawn({
                cmd: await this.cmd(),
                args: ['-d', String(serial), 'oath', 'accounts', 'code'],
                noStdOutLogging: true,
                throwOnStdErr: true
            });
            stdout = res?.stdout ?? '';
        } catch (err) {
            if (this.aborted) {
                throw new Error('Aborted');
            }
            throw err;
        } finally {
            this.processIsRunning = false;
        }

        const codes: YubiKeyOtpCodeInfo[] = [];

        for (const line of stdout.split('\n')) {
            const match = /^(.*?):(.*?)\s+(.*)$/.exec(line);
            if (!match) {
                continue;
            }
            const [, title, user, code] = match;
            const needsTouch = !/^\d+$/.exec(code);

            codes.push({
                title,
                user,
                needsTouch
            });
        }

        return codes;
    },

    async getOtp(serial: number, entry: string): Promise<string> {
        const res = await Launcher?.spawn({
            cmd: await this.cmd(),
            args: ['-d', String(serial), 'oath', 'accounts', 'code', '--single', entry],
            noStdOutLogging: true
        });

        const code = res?.stdout?.trim();
        if (!code) {
            throw new Error('Nothing returned');
        }
        return code;
    },

    calculateChalResp(chalResp: FileChalRespConfig, challenge: ArrayBuffer): Promise<ArrayBuffer> {
        // const { vid, pid, serial, slot } = chalResp;
        // const yubiKey = { vid, pid, serial };

        const challengeBuffer = Buffer.from(challenge);

        // https://github.com/Yubico/yubikey-personalization-gui/issues/86
        // https://github.com/keepassxreboot/keepassxc/blob/develop/src/keys/drivers/YubiKey.cpp#L318

        const padLen = YubiKeyChallengeSize - challenge.byteLength;

        const paddedChallenge = Buffer.alloc(YubiKeyChallengeSize, padLen);
        challengeBuffer.copy(paddedChallenge);

        throw new Error('Not implemented'); // TODO(ts): chal-resp

        // NativeModules.yubiKeyChallengeResponse(
        //     yubiKey,
        //     [...paddedChallenge],
        //     slot,
        //     (err, result) => {
        //         if (result) {
        //             result = Buffer.from(result);
        //         }
        //         if (err) {
        //             err.ykError = true;
        //         }
        //         return callback(err, result);
        //     }
        // );
    },

    async cancelChalResp(): Promise<void> {
        await NativeModules.yubiKeyCancelChallengeResponse();
    }
};

export { YubiKey };
