import * as kdbxweb from 'kdbxweb';
import { DefaultModelEvents, Model } from 'util/model';
import { Entry } from 'models/entry';
import { Group } from 'models/group';
import { IconUrlFormat } from 'util/formatting/icon-url-format';
import { Logger } from 'util/logger';
import { Locale } from 'util/locale';
import { StringFormat } from 'util/formatting/string-format';
import { StorageFileOptions } from 'storage/types';
import { FileBackupConfig, FileChalRespConfig } from './file-info';
import { IdGenerator } from 'util/generators/id-generator';
import { Filter } from 'models/filter';
// import { ChalRespCalculator } from 'comp/app/chal-resp-calculator';

const DemoFileData = require('demo.kdbx') as string;

const logger = new Logger('file');

type KdfName = 'AES' | 'Argon2d' | 'Argon2id';

interface FileKdfParamsAes {
    type: 'AES';
    name: 'AES';
    rounds: number;
}

interface FileKdfParamsArgon2 {
    type: 'Argon2';
    name: 'Argon2d' | 'Argon2id';
    parallelism: number;
    iterations: number;
    memory: number;
}

type FileKdfParams = FileKdfParamsAes | FileKdfParamsArgon2;

interface FileEvents extends DefaultModelEvents {
    'reload': () => void;
    'ejected': () => void;
}

const FilterIncludingDisabled = new Filter({ includeDisabled: true });

class File extends Model<FileEvents> {
    readonly id: string;
    db: kdbxweb.Kdbx;
    name: string;
    uuid?: string;
    keyFileName?: string;
    keyFilePath?: string;
    // chalResp = null; // TODO: chal-resp
    passwordLength?: number;
    path?: string;
    opts?: StorageFileOptions;
    storage?: string;
    modified = false;
    dirty = false;
    created = false;
    demo = false;
    groups: Group[] = [];
    oldPasswordLength?: number;
    oldKeyFileName?: string;
    passwordChanged = false;
    keyFileChanged = false;
    keyChangeForce?: number | undefined;
    syncing = false;
    syncError?: string;
    syncDate?: Date;
    backup?: FileBackupConfig;
    backupInProgress?: boolean;
    chalResp?: FileChalRespConfig;
    formatVersion?: number;
    defaultUser?: string;
    recycleBinEnabled?: boolean;
    historyMaxItems?: number;
    historyMaxSize?: number;
    keyEncryptionRounds?: number;
    kdfParameters?: FileKdfParams;
    oldPasswordHash?: kdbxweb.ProtectedValue;
    oldKeyFileHash?: kdbxweb.ProtectedValue;
    oldKeyChangeDate?: Date;
    encryptedPassword?: string;
    encryptedPasswordDate?: Date;
    supportsTags = true;
    supportsColors = true;
    supportsIcons = true;
    supportsExpiration = true;
    backend?: string;

    private readonly _entryMap = new Map<string, Entry>();
    private readonly _groupMap = new Map<string, Group>();

    constructor(id: string, name: string, db: kdbxweb.Kdbx) {
        super();
        this.id = id;
        this.name = name;
        this.db = db;
    }

    static async open(
        id: string,
        name: string,
        password: kdbxweb.ProtectedValue,
        fileData: ArrayBuffer,
        keyFileData?: ArrayBuffer
    ): Promise<File> {
        try {
            // const challengeResponse = ChalRespCalculator.build(this.chalResp); // TODO: chal-resp
            const credentials = new kdbxweb.Credentials(
                password,
                keyFileData
                // , challengeResponse // TODO: chal-resp
            );
            const ts = logger.ts();

            let db: kdbxweb.Kdbx;
            try {
                db = await kdbxweb.Kdbx.load(fileData, credentials);
            } catch (err) {
                if (
                    err instanceof kdbxweb.KdbxError &&
                    err.code === kdbxweb.Consts.ErrorCodes.InvalidKey &&
                    password &&
                    !password.byteLength
                ) {
                    logger.info(
                        'Error opening file with empty password, try to open with null password'
                    );
                    db = await kdbxweb.Kdbx.load(fileData, credentials);
                } else {
                    throw err;
                }
            }

            const file = new File(id, name, db);

            file.readModel();
            file.setOpenFile({ passwordLength: password ? password.textLength : 0 });
            if (keyFileData) {
                kdbxweb.ByteUtils.zeroBuffer(keyFileData);
            }

            const kdfStr = file.kdfArgsToString();
            const fileSizeKb = Math.round(fileData.byteLength / 1024);
            logger.info(`Opened file ${name}: ${logger.ts(ts)}, ${kdfStr}, ${fileSizeKb} kB`);

            return file;
        } catch (e) {
            logger.error('Error opening file', e);
            throw e;
        }
    }

    static create(id: string, name: string): Promise<File> {
        const password = kdbxweb.ProtectedValue.fromString('');
        const credentials = new kdbxweb.Credentials(password);
        const db = kdbxweb.Kdbx.create(credentials, name);
        const file = new File(id, name, db);
        file.created = true;
        file.readModel();
        return Promise.resolve(file);
    }

    static async importWithXml(id: string, name: string, xml: string): Promise<File> {
        logger.info(`Importing file from XML: ${name}`);
        try {
            const ts = logger.ts();
            const password = kdbxweb.ProtectedValue.fromString('');
            const credentials = new kdbxweb.Credentials(password);

            const db = await kdbxweb.Kdbx.loadXml(xml, credentials);
            const file = new File(id, name, db);

            file.readModel();
            file.created = true;
            logger.info(`Imported file ${name}: ${logger.ts(ts)}`);

            return file;
        } catch (e) {
            logger.error('Error importing XML', e);
            throw e;
        }
    }

    static async openDemo(): Promise<File> {
        const password = kdbxweb.ProtectedValue.fromString('demo');
        const credentials = new kdbxweb.Credentials(password);
        const demoFile = kdbxweb.ByteUtils.arrayToBuffer(
            kdbxweb.ByteUtils.base64ToBytes(DemoFileData)
        );
        const db = await kdbxweb.Kdbx.load(demoFile, credentials);

        const file = new File(IdGenerator.uuid(), 'Demo', db);
        file.demo = true;
        file.readModel();
        file.setOpenFile({ passwordLength: 4 });

        return file;
    }

    private kdfArgsToString(): string {
        if (this.db.header.kdfParameters) {
            const kdfParameters = this.db.header.kdfParameters;
            return kdfParameters
                .keys()
                .map((key) => {
                    const val = kdfParameters.get(key);
                    if (val instanceof ArrayBuffer) {
                        return undefined;
                    }
                    return `${key}=${String(val)}`;
                })
                .filter((p) => p)
                .join('&');
        } else if (this.db.header.keyEncryptionRounds) {
            return `${this.db.header.keyEncryptionRounds} rounds`;
        } else {
            return '?';
        }
    }

    private setOpenFile({ passwordLength }: { passwordLength: number }) {
        this.batchSet(() => {
            this.oldKeyFileName = this.keyFileName;
            this.oldPasswordLength = passwordLength;
            this.passwordChanged = false;
            this.keyFileChanged = false;
        });
        this.oldPasswordHash = this.db.credentials.passwordHash;
        this.oldKeyFileHash = this.db.credentials.keyFileHash;
        this.oldKeyChangeDate = this.db.meta.keyChanged;
    }

    private readModel() {
        const groups: Group[] = [];
        this.batchSet(() => {
            this.uuid = this.db.getDefaultGroup().uuid.toString();
            this.groups = groups;
            this.formatVersion = this.db.header.versionMajor;
            this.defaultUser = this.db.meta.defaultUser;
            this.recycleBinEnabled = this.db.meta.recycleBinEnabled;
            this.historyMaxItems = this.db.meta.historyMaxItems;
            this.historyMaxSize = this.db.meta.historyMaxSize;
            this.keyEncryptionRounds = this.db.header.keyEncryptionRounds;
            this.keyChangeForce = this.db.meta.keyChangeForce;
            this.kdfParameters = this.readKdfParams();
        });
        for (const group of this.db.groups) {
            let groupModel = this.getGroup(this.subId(group.uuid.id));
            if (groupModel) {
                groupModel.setGroup(group, this, undefined);
            } else {
                groupModel = new Group(group, this, undefined);
            }
            groups.push(groupModel);
        }
        this.buildObjectMap();
        this.resolveFieldReferences();
    }

    private readKdfParams(): FileKdfParams | undefined {
        const kdfParameters = this.db.header.kdfParameters;
        if (!kdfParameters) {
            return undefined;
        }
        let uuid = kdfParameters.get('$UUID');
        if (!(uuid instanceof ArrayBuffer)) {
            return undefined;
        }
        uuid = kdbxweb.ByteUtils.bytesToBase64(uuid);
        switch (uuid) {
            case kdbxweb.Consts.KdfId.Argon2d:
            case kdbxweb.Consts.KdfId.Argon2id:
                return {
                    type: 'Argon2',
                    name: uuid === kdbxweb.Consts.KdfId.Argon2d ? 'Argon2d' : 'Argon2id',
                    parallelism: File.getKdfNumber(kdfParameters, 'P'),
                    iterations: File.getKdfNumber(kdfParameters, 'I'),
                    memory: File.getKdfNumber(kdfParameters, 'M')
                };
            case kdbxweb.Consts.KdfId.Aes:
                return {
                    type: 'AES',
                    name: 'AES',
                    rounds: File.getKdfNumber(kdfParameters, 'R')
                };
            default:
                return undefined;
        }
    }

    private static getKdfNumber(kdfParameters: kdbxweb.VarDictionary, key: string): number {
        const value = kdfParameters.get(key);
        if (value instanceof kdbxweb.Int64) {
            return value.valueOf();
        }
        if (typeof value === 'number') {
            return value;
        }
        return -1;
    }

    subId(id: string): string {
        return this.id + ':' + id;
    }

    private buildObjectMap(): void {
        this._entryMap.clear();
        this._groupMap.clear();

        for (const group of this.allGroupsMatching(FilterIncludingDisabled)) {
            this._groupMap.set(group.id, group);
            for (const entry of group.ownEntriesMatching(FilterIncludingDisabled)) {
                this._entryMap.set(entry.id, entry);
            }
        }
    }

    private resolveFieldReferences(): void {
        for (const entry of this._entryMap.values()) {
            entry.resolveFieldReferences();
        }
    }

    reload(): void {
        this.buildObjectMap();
        this.readModel();
        this.emit('reload');
    }

    async mergeOrUpdate(
        fileData: ArrayBuffer,
        remoteKey?: {
            password?: kdbxweb.ProtectedValue;
            keyFileName?: string;
            keyFileData?: ArrayBuffer;
        }
    ): Promise<void> {
        let credentials: kdbxweb.Credentials;
        if (remoteKey) {
            // TODO: chal-resp
            credentials = new kdbxweb.Credentials(null);
            await credentials.ready;
            if (remoteKey.password) {
                await credentials.setPassword(remoteKey.password);
            } else {
                credentials.passwordHash = this.db.credentials.passwordHash;
            }
            if (remoteKey.keyFileName) {
                if (remoteKey.keyFileData) {
                    await credentials.setKeyFile(remoteKey.keyFileData);
                } else {
                    credentials.keyFileHash = this.db.credentials.keyFileHash;
                }
            }
        } else {
            credentials = this.db.credentials;
        }

        let remoteDb: kdbxweb.Kdbx;
        try {
            remoteDb = await kdbxweb.Kdbx.load(fileData, credentials);
        } catch (err) {
            logger.error('Error opening file to merge', err);
            throw err;
        }

        if (this.modified) {
            try {
                if (
                    remoteKey &&
                    remoteDb.meta.keyChanged &&
                    this.db.meta.keyChanged &&
                    remoteDb.meta.keyChanged.getTime() > this.db.meta.keyChanged.getTime()
                ) {
                    this.db.credentials = remoteDb.credentials;
                    this.keyFileName = remoteKey.keyFileName;
                    if (remoteKey.password) {
                        this.passwordLength = remoteKey.password.textLength;
                    }
                }
                this.db.merge(remoteDb);
            } catch (e) {
                logger.error('File merge error', e);
                throw e;
            }
        } else {
            this.db = remoteDb;
        }
        this.dirty = true;
        this.reload();
    }

    getLocalEditState(): kdbxweb.KdbxEditState {
        return this.db.getLocalEditState();
    }

    setLocalEditState(editState: kdbxweb.KdbxEditState): void {
        this.db.setLocalEditState(editState);
    }

    close(): void {
        this.batchSet(() => {
            this.keyFileName = '';
            this.passwordLength = 0;
            this.modified = false;
            this.dirty = false;
            this.created = false;
            this.groups = [];
            this.passwordChanged = false;
            this.keyFileChanged = false;
            this.syncing = false;
        });
        // TODO: chal-resp
        // if (this.chalResp && !AppSettings.yubiKeyRememberChalResp) {
        //     ChalRespCalculator.clearCache(this.chalResp);
        // }
    }

    getEntry(id: string): Entry | undefined {
        return this._entryMap.get(id);
    }

    getGroup(id: string): Group | undefined {
        return this._groupMap.get(id);
    }

    *entriesMatching(filter: Filter): Generator<Entry> {
        let top: Group | undefined; // = this
        if (filter.trash) {
            const recycleBinUuid = this.db.meta.recycleBinUuid?.id;
            if (recycleBinUuid) {
                top = this.getGroup(recycleBinUuid);
            }
        } else if (filter.group) {
            top = this.getGroup(filter.group);
        }

        if (top) {
            yield* top.ownEntriesMatching(filter);
            if (!filter.group || filter.subGroups) {
                for (const group of top.allGroupsMatching(filter)) {
                    yield* group.ownEntriesMatching(filter);
                }
            }
        } else {
            for (const group of this.allGroupsMatching(filter)) {
                yield* group.ownEntriesMatching(filter);
            }
        }
    }

    *allGroupsMatching(filter: Filter): Generator<Group> {
        for (const group of this.groups) {
            if (group.matches(filter)) {
                yield group;
                yield* group.allGroupsMatching(filter);
            }
        }
    }

    *allEntryTemplates(): Generator<Entry> {
        if (!this.db.meta.entryTemplatesGroup) {
            return;
        }
        const group = this.getGroup(this.subId(this.db.meta.entryTemplatesGroup.id));
        if (!group) {
            return;
        }
        yield* group.ownEntriesMatching(new Filter());
    }

    getTrashGroup(): Group | undefined {
        return this.db.meta.recycleBinEnabled && this.db.meta.recycleBinUuid
            ? this.getGroup(this.subId(this.db.meta.recycleBinUuid.id))
            : undefined;
    }

    getEntryTemplatesGroup(): Group | undefined {
        return this.db.meta.entryTemplatesGroup
            ? this.getGroup(this.subId(this.db.meta.entryTemplatesGroup.id))
            : undefined;
    }

    createEntryTemplatesGroup(): Group {
        const rootGroup = this.groups[0];
        const templatesGroup = Group.newGroup(rootGroup, this);
        templatesGroup.setName(StringFormat.capFirst(Locale.templates));
        this.db.meta.entryTemplatesGroup = templatesGroup.group.uuid;
        this.reload();
        return templatesGroup;
    }

    setModified(): void {
        if (!this.demo) {
            this.batchSet(() => {
                this.modified = true;
                this.dirty = true;
            });
        }
    }

    getData(): Promise<ArrayBuffer> {
        this.db.cleanup({
            historyRules: true,
            customIcons: true,
            binaries: true
        });
        return this.db.save();
    }

    getXml(): Promise<string> {
        return this.db.saveXml(true);
    }

    getKeyFileHash(): string | undefined {
        const hash = this.db.credentials.keyFileHash;
        return hash ? kdbxweb.ByteUtils.bytesToBase64(hash.getBinary()) : undefined;
    }

    setSyncProgress(): void {
        this.syncing = true;
    }

    setSyncComplete(
        path: string | undefined,
        storage: string | undefined,
        error: string | undefined
    ): void {
        if (!error) {
            this.db.removeLocalEditState();
        }
        this.batchSet(() => {
            this.created = false;
            this.path = path || this.path;
            this.storage = storage || this.storage;
            this.modified = this.modified && !!error;
            this.dirty = error ? this.dirty : false;
            this.syncing = false;
            this.syncError = error;

            if (!error && this.passwordChanged && this.encryptedPassword) {
                this.encryptedPassword = undefined;
                this.encryptedPasswordDate = undefined;
            }
        });

        this.setOpenFile({ passwordLength: this.passwordLength || 0 });
        for (const entry of this.entriesMatching(FilterIncludingDisabled)) {
            entry.setSaved();
        }
    }

    async setPassword(password: kdbxweb.ProtectedValue): Promise<void> {
        await this.db.credentials.setPassword(password);
        this.db.meta.keyChanged = new Date();
        this.batchSet(() => {
            this.passwordLength = password.textLength;
            this.passwordChanged = true;
        });
        this.setModified();
    }

    resetPassword(): void {
        this.db.credentials.passwordHash = this.oldPasswordHash;
        if (this.db.credentials.keyFileHash === this.oldKeyFileHash) {
            this.db.meta.keyChanged = this.oldKeyChangeDate;
        }
        this.batchSet(() => {
            this.passwordLength = this.oldPasswordLength;
            this.passwordChanged = false;
        });
    }

    async setKeyFile(keyFile: Uint8Array | null, keyFileName: string | undefined): Promise<void> {
        await this.db.credentials.setKeyFile(keyFile);
        this.db.meta.keyChanged = new Date();
        this.batchSet(() => {
            this.keyFileName = keyFileName;
            this.keyFileChanged = true;
        });
        this.setModified();
    }

    async generateAndSetKeyFile(): Promise<Uint8Array> {
        const keyFile = await kdbxweb.Credentials.createRandomKeyFile();
        const keyFileName = 'Generated';
        await this.setKeyFile(keyFile, keyFileName);
        return keyFile;
    }

    resetKeyFile(): void {
        this.db.credentials.keyFileHash = this.oldKeyFileHash;
        if (this.db.credentials.passwordHash === this.oldPasswordHash) {
            this.db.meta.keyChanged = this.oldKeyChangeDate;
        }
        this.batchSet(() => {
            this.keyFileName = this.oldKeyFileName;
            this.keyFileChanged = false;
        });
    }

    removeKeyFile(): void {
        this.db.credentials.keyFileHash = undefined;
        const changed = !!this.oldKeyFileHash;
        if (!changed && this.db.credentials.passwordHash === this.oldPasswordHash) {
            this.db.meta.keyChanged = this.oldKeyChangeDate;
        }
        this.batchSet(() => {
            this.keyFileName = undefined;
            this.keyFilePath = undefined;
            this.keyFileChanged = changed;
        });
        this.setModified();
    }

    isKeyChangePending(force: boolean): boolean {
        if (!this.db.meta.keyChanged) {
            return false;
        }
        const expiryDays = force ? this.db.meta.keyChangeForce : this.db.meta.keyChangeRec;
        if (!expiryDays || expiryDays < 0 || isNaN(expiryDays)) {
            return false;
        }
        const daysDiff = (Date.now() - this.db.meta.keyChanged.getTime()) / 1000 / 3600 / 24;
        return daysDiff > expiryDays;
    }

    // setChallengeResponse(chalResp) { // TODO: chal-resp
    //     if (this.chalResp && !AppSettingsModel.yubiKeyRememberChalResp) {
    //         ChalRespCalculator.clearCache(this.chalResp);
    //     }
    //     this.db.credentials.setChallengeResponse(ChalRespCalculator.build(chalResp));
    //     this.db.meta.keyChanged = new Date();
    //     this.chalResp = chalResp;
    //     this.setModified();
    // }

    setKeyChange(force: boolean, days: number): void {
        if (isNaN(days) || !days || days < 0) {
            days = -1;
        }
        const prop = force ? 'keyChangeForce' : 'keyChangeRec';
        this.db.meta[prop] = days;
        if (force) {
            this.db.meta.keyChangeForce = days;
        } else {
            this.db.meta.keyChangeRec = days;
        }
        this.setModified();
    }

    setName(name: string): void {
        this.db.meta.name = name;
        this.db.meta.nameChanged = new Date();
        this.name = name;
        this.groups[0].setName(name);
        this.setModified();
        this.reload();
    }

    setDefaultUser(defaultUser: string): void {
        this.db.meta.defaultUser = defaultUser;
        this.db.meta.defaultUserChanged = new Date();
        this.defaultUser = defaultUser;
        this.setModified();
    }

    setRecycleBinEnabled(enabled: boolean): void {
        this.db.meta.recycleBinEnabled = enabled;
        if (enabled) {
            this.db.createRecycleBin();
        }
        this.recycleBinEnabled = enabled;
        this.setModified();
    }

    setHistoryMaxItems(count: number): void {
        this.db.meta.historyMaxItems = count;
        this.historyMaxItems = count;
        this.setModified();
    }

    setHistoryMaxSize(size: number): void {
        this.db.meta.historyMaxSize = size;
        this.historyMaxSize = size;
        this.setModified();
    }

    setKeyEncryptionRounds(rounds: number): void {
        this.db.header.keyEncryptionRounds = rounds;
        this.keyEncryptionRounds = rounds;
        this.setModified();
    }

    setKdfParameter(
        field: keyof FileKdfParamsAes | keyof FileKdfParamsArgon2,
        value: number
    ): void {
        const ValueType = kdbxweb.VarDictionary.ValueType;
        const kdfParameters = this.db.header.kdfParameters;
        if (!kdfParameters) {
            throw new Error('No kdf parameters');
        }
        switch (field) {
            case 'memory':
                kdfParameters.set('M', ValueType.UInt64, kdbxweb.Int64.from(value));
                break;
            case 'iterations':
                kdfParameters.set('I', ValueType.UInt64, kdbxweb.Int64.from(value));
                break;
            case 'parallelism':
                kdfParameters.set('P', ValueType.UInt32, value);
                break;
            case 'rounds':
                kdfParameters.set('R', ValueType.UInt32, value);
                break;
            default:
                return;
        }
        this.kdfParameters = this.readKdfParams();
        this.setModified();
    }

    emptyTrash(): void {
        const trashGroup = this.getTrashGroup();
        if (trashGroup) {
            let modified = false;
            trashGroup.group.groups.slice().forEach((group) => {
                this.db.move(group, null);
                modified = true;
            });
            trashGroup.group.entries.slice().forEach((entry) => {
                this.db.move(entry, null);
                modified = true;
            });
            trashGroup.items.length = 0;
            trashGroup.entries.length = 0;
            if (modified) {
                this.setModified();
            }
        }
    }

    getCustomIcons(): Map<string, string> {
        const customIcons = new Map<string, string>();
        for (const [id, icon] of this.db.meta.customIcons) {
            const iconData = IconUrlFormat.toDataUrl(icon.data);
            if (iconData) {
                customIcons.set(id, iconData);
            }
        }
        return customIcons;
    }

    addCustomIcon(iconData: string): string {
        const uuid = kdbxweb.KdbxUuid.random();
        this.db.meta.customIcons.set(uuid.id, {
            data: kdbxweb.ByteUtils.arrayToBuffer(kdbxweb.ByteUtils.base64ToBytes(iconData)),
            lastModified: new Date()
        });
        return uuid.toString();
    }

    renameTag(from: string, to: string): void {
        for (const entry of this.entriesMatching(FilterIncludingDisabled)) {
            entry.renameTag(from, to);
        }
    }

    setFormatVersion(version: 3 | 4): void {
        this.db.setVersion(version);
        this.setModified();
        this.readModel();
    }

    setKdf(kdfName: KdfName): void {
        const kdfParameters = this.db.header.kdfParameters;
        if (!kdfParameters) {
            throw new Error('Cannot set KDF on this version');
        }
        switch (kdfName) {
            case 'AES':
                this.db.setKdf(kdbxweb.Consts.KdfId.Aes);
                break;
            case 'Argon2d':
                this.db.setKdf(kdbxweb.Consts.KdfId.Argon2d);
                break;
            case 'Argon2id':
                this.db.setKdf(kdbxweb.Consts.KdfId.Argon2id);
                break;
            default:
                throw new Error('Bad KDF name');
        }
        this.setModified();
        this.readModel();
    }

    static createKeyFileWithHash(hash: string): Uint8Array {
        const hashData = kdbxweb.ByteUtils.base64ToBytes(hash);
        const hexHash = kdbxweb.ByteUtils.bytesToHex(hashData);
        return kdbxweb.ByteUtils.stringToBytes(hexHash);
    }
}

export { File };
