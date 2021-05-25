import * as kdbxweb from 'kdbxweb';
import { Model } from 'util/model';
import { IconMap } from 'const/icon-map';
import { BuiltInFields } from 'const/entry-fields';
import { Attachment } from 'models/attachment';
import { Color } from 'util/data/color';
import { Otp } from 'util/data/otp';
import { IconUrlFormat } from 'util/formatting/icon-url-format';
import { Group } from './group';
import { File } from './file';
import { isEqual } from 'util/fn';
import { AppSettings } from './app-settings';
import { Filter } from './filter';
import { EntrySearch } from 'comp/search/entry-search';
import { Ranking } from 'util/data/ranking';

const UrlRegex = /^https?:\/\//i;
const FieldRefRegex = /^\{REF:([TNPAU])@I:(\w{32})}$/;
const FieldRefFields = ['title', 'user', 'url', 'notes'] as const;
const FieldRefIds = new Map<string, string>([
    ['T', 'Title'],
    ['U', 'UserName'],
    ['P', 'Password'],
    ['A', 'URL'],
    ['N', 'Notes']
]);
const FieldRankWeights = new Map<string, number>([
    ['Title', 10],
    ['URL', 8],
    ['UserName', 5],
    ['Notes', 2]
]);
const ExtraUrlFieldName = 'KP2A_URL';
const BuiltInFieldsSet = new Set<string>(BuiltInFields);

class Entry extends Model {
    readonly id: string;
    readonly uuid: string;
    entry: kdbxweb.KdbxEntry;
    group: Group;
    file: File;
    hasFieldRefs?: boolean;
    isJustCreated?: boolean;
    canBeDeleted?: boolean;
    unsaved?: boolean;
    created?: Date;
    updated?: Date;
    expires?: Date;
    expired?: boolean;
    fileName?: string;
    groupName?: string;
    title?: string;
    password?: kdbxweb.ProtectedValue;
    notes?: string;
    url?: string;
    displayUrl?: string;
    user?: string;
    iconId?: number;
    icon?: string;
    tags?: string[];
    color?: string;
    fields?: Map<string, kdbxweb.KdbxEntryField>;
    attachments?: Attachment[];
    historyLength?: number;
    titleUserLower?: string;
    searchText?: string;
    searchTags?: string[];
    searchColor?: string;
    customIcon?: string;
    customIconId?: string;
    autoTypeEnabled?: boolean | null;
    autoTypeObfuscation?: boolean;
    autoTypeSequence?: string;
    otpGenerator?: Otp;
    backend?: string;

    constructor(entry: kdbxweb.KdbxEntry, group: Group, file: File) {
        super();

        this.id = file.subId(entry.uuid.id);
        this.uuid = entry.uuid.id;
        this.entry = entry;
        this.group = group;
        this.file = file;

        this.setEntry(entry, group, file);
    }

    setEntry(entry: kdbxweb.KdbxEntry, group: Group, file: File): void {
        if (entry.uuid.id !== this.uuid) {
            throw new Error('Cannot change entry uuid');
        }

        this.entry = entry;
        this.group = group;
        this.file = file;
        this.checkUpdatedEntry();

        // we cannot calculate field references now because database index has not yet been built
        this.fillByEntry({ skipFieldReferences: true });
    }

    private fillByEntry(opts?: { skipFieldReferences?: boolean }) {
        const entry = this.entry;
        this.fileName = this.file.name;
        this.groupName = this.group.title;
        this.title = this.getFieldString('Title');
        this.password = this.getPassword();
        this.notes = this.getFieldString('Notes');
        this.url = this.getFieldString('URL');
        this.displayUrl = this.getDisplayUrl(this.getFieldString('URL'));
        this.user = this.getFieldString('UserName');
        this.iconId = entry.icon;
        this.icon = this.iconFromId(entry.icon);
        this.tags = entry.tags;
        this.color = this.colorToModel(entry.bgColor) || this.colorToModel(entry.fgColor);
        this.fields = this.fieldsToModel();
        this.attachments = this.attachmentsToModel(entry.binaries);
        this.created = entry.times.creationTime;
        this.updated = entry.times.lastModTime;
        this.expires = entry.times.expires ? entry.times.expiryTime : undefined;
        this.expired = !!(
            entry.times.expires &&
            entry.times.expiryTime &&
            entry.times.expiryTime <= new Date()
        );
        this.historyLength = entry.history.length;
        this.titleUserLower = `${this.title}:${this.user}`.toLowerCase();
        this.buildCustomIcon();
        this.buildSearchText();
        this.buildSearchTags();
        this.buildSearchColor();
        this.buildAutoType();
        if (!opts?.skipFieldReferences && this.hasFieldRefs !== false) {
            this.resolveFieldReferences();
        }
    }

    private getPassword(): kdbxweb.ProtectedValue {
        const password = this.entry.fields.get('Password') ?? kdbxweb.ProtectedValue.fromString('');
        if (password instanceof kdbxweb.ProtectedValue) {
            return password;
        }
        return kdbxweb.ProtectedValue.fromString(password);
    }

    private getFieldString(field: string): string {
        const val = this.entry.fields.get(field);
        if (!val) {
            return '';
        }
        if (val instanceof kdbxweb.ProtectedValue) {
            return val.getText();
        }
        return val.toString();
    }

    private checkUpdatedEntry() {
        if (this.isJustCreated) {
            this.isJustCreated = false;
        }
        if (this.canBeDeleted) {
            this.canBeDeleted = false;
        }
        if (this.unsaved && !isEqual(this.updated, this.entry.times.lastModTime)) {
            this.unsaved = false;
        }
    }

    private buildSearchText(): void {
        let text = '';
        for (const value of this.entry.fields.values()) {
            if (typeof value === 'string') {
                text += value.toLowerCase() + '\n';
            }
        }
        for (const tag of this.entry.tags) {
            text += tag.toLowerCase() + '\n';
        }
        for (const title of this.entry.binaries.keys()) {
            text += title.toLowerCase() + '\n';
        }
        this.searchText = text;
    }

    private buildCustomIcon(): void {
        this.customIcon = undefined;
        this.customIconId = undefined;
        if (this.entry.customIcon) {
            const icon = this.file.db.meta.customIcons.get(this.entry.customIcon.id);
            if (icon) {
                this.customIcon = IconUrlFormat.toDataUrl(icon.data) ?? undefined;
            }
            this.customIconId = this.entry.customIcon.toString();
        }
    }

    private buildSearchTags(): void {
        this.searchTags = this.entry.tags.map((tag) => tag.toLowerCase());
    }

    private buildSearchColor(): void {
        this.searchColor = this.color;
    }

    private buildAutoType(): void {
        this.autoTypeEnabled = this.entry.autoType.enabled;
        this.autoTypeObfuscation =
            this.entry.autoType.obfuscation ===
            kdbxweb.Consts.AutoTypeObfuscationOptions.UseClipboard;
        this.autoTypeSequence = this.entry.autoType.defaultSequence;
    }

    private iconFromId(id: number | undefined): string | undefined {
        return id === undefined ? undefined : IconMap[id];
    }

    private getDisplayUrl(url: string): string {
        if (!url) {
            return '';
        }
        return url.replace(UrlRegex, '');
    }

    private colorToModel(color: string | undefined): string | undefined {
        return color ? Color.getNearest(color) : undefined;
    }

    private fieldsToModel(): Map<string, kdbxweb.KdbxEntryField> {
        const fields = new Map<string, kdbxweb.KdbxEntryField>();
        for (const [field, value] of this.entry.fields) {
            if (!BuiltInFieldsSet.has(field)) {
                fields.set(field, value);
            }
        }
        return fields;
    }

    private attachmentsToModel(
        binaries: Map<string, kdbxweb.KdbxBinary | kdbxweb.KdbxBinaryWithHash>
    ): Attachment[] {
        const att: Attachment[] = [];
        for (const [title, data] of binaries) {
            att.push(new Attachment(title, data));
        }
        return att;
    }

    private entryModified() {
        if (!this.unsaved) {
            this.unsaved = true;
            if (this.file.historyMaxItems !== 0) {
                this.entry.pushHistory();
            }
            this.file.setModified();
        }
        if (this.isJustCreated) {
            this.isJustCreated = false;
            this.file.reload();
        }
        this.entry.times.update();
    }

    setSaved(): void {
        if (this.unsaved) {
            this.unsaved = false;
        }
        if (this.canBeDeleted) {
            this.canBeDeleted = false;
        }
    }

    matches(filter: Filter): boolean {
        return EntrySearch.matches(this, filter);
    }

    getAllFields(): Map<string, kdbxweb.KdbxEntryField> {
        return this.entry.fields;
    }

    *getAllHistoryEntriesFields(): Generator<Map<string, kdbxweb.KdbxEntryField>> {
        for (const historyEntry of this.entry.history) {
            yield historyEntry.fields;
        }
    }

    resolveFieldReferences(): void {
        this.hasFieldRefs = false;
        FieldRefFields.forEach((field) => {
            const fieldValue = this[field];
            const refValue = this.resolveFieldReference(fieldValue);
            if (refValue !== undefined) {
                if (refValue instanceof kdbxweb.ProtectedValue) {
                    this[field] = refValue.getText();
                } else {
                    this[field] = refValue;
                }
                this.hasFieldRefs = true;
            }
        });

        const refValue = this.resolveFieldReference(this.password);
        if (refValue !== undefined) {
            if (refValue instanceof kdbxweb.ProtectedValue) {
                this.password = refValue;
            } else {
                this.password = kdbxweb.ProtectedValue.fromString(refValue);
            }
            this.hasFieldRefs = true;
        }
    }

    getFieldValue(field: string): kdbxweb.KdbxEntryField | undefined {
        field = field.toLowerCase();
        let resolvedField;
        [...this.entry.fields.keys()].some((entryField) => {
            if (entryField.toLowerCase() === field) {
                resolvedField = entryField;
                return true;
            }
            return false;
        });
        if (resolvedField) {
            let fieldValue = this.entry.fields.get(resolvedField);
            const refValue = this.resolveFieldReference(fieldValue);
            if (refValue !== undefined) {
                fieldValue = refValue;
            }
            return fieldValue;
        }
    }

    private resolveFieldReference(fieldValue: kdbxweb.KdbxEntryField | undefined) {
        if (!fieldValue) {
            return;
        }
        if (fieldValue instanceof kdbxweb.ProtectedValue && fieldValue.isFieldReference()) {
            fieldValue = fieldValue.getText();
        }
        if (typeof fieldValue !== 'string') {
            return;
        }
        const match = FieldRefRegex.exec(fieldValue);
        if (!match) {
            return;
        }
        return this.getReferenceValue(match[1], match[2]);
    }

    private getReferenceValue(
        fieldRefId: string,
        idStr: string
    ): kdbxweb.KdbxEntryField | undefined {
        const id = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            id[i] = parseInt(idStr.substr(i * 2, 2), 16);
        }
        const uuid = new kdbxweb.KdbxUuid(id);
        const entry = this.file.getEntry(this.file.subId(uuid.id));
        if (!entry) {
            return undefined;
        }
        const refField = FieldRefIds.get(fieldRefId);
        if (!refField) {
            return undefined;
        }
        return entry.entry.fields.get(refField);
    }

    setColor(color: string): void {
        this.entryModified();
        this.entry.bgColor = Color.getKnownBgColor(color);
        this.fillByEntry();
    }

    setIcon(iconId: number): void {
        this.entryModified();
        this.entry.icon = iconId;
        this.entry.customIcon = undefined;
        this.fillByEntry();
    }

    setCustomIcon(customIconId: string): void {
        this.entryModified();
        this.entry.customIcon = new kdbxweb.KdbxUuid(customIconId);
        this.fillByEntry();
    }

    setExpires(dt: Date | undefined): void {
        this.entryModified();
        this.entry.times.expiryTime = dt;
        this.entry.times.expires = !!dt;
        this.fillByEntry();
    }

    setTags(tags: string[]): void {
        this.entryModified();
        this.entry.tags = tags;
        this.fillByEntry();
    }

    renameTag(from: string, to: string): void {
        const ix = this.entry.tags.findIndex((tag) => tag.toLowerCase() === from.toLowerCase());
        if (ix < 0) {
            return;
        }
        this.entryModified();
        this.entry.tags.splice(ix, 1);
        if (to) {
            this.entry.tags.push(to);
        }
        this.fillByEntry();
    }

    setField(field: string, val: kdbxweb.KdbxEntryField | undefined, allowEmpty?: boolean): void {
        const hasValue = val && (typeof val === 'string' || (val.isProtected && val.byteLength));
        if (hasValue || allowEmpty || BuiltInFields.indexOf(field) >= 0) {
            this.entryModified();
            if (typeof val === 'string') {
                val = this.sanitizeFieldValue(val);
            }
            if (val === undefined) {
                val = '';
            }
            this.entry.fields.set(field, val);
        } else if (this.entry.fields.has(field)) {
            this.entryModified();
            this.entry.fields.delete(field);
        }
        this.fillByEntry();
    }

    private sanitizeFieldValue(val: string): string {
        // https://github.com/keeweb/keeweb/issues/910
        // eslint-disable-next-line no-control-regex
        return val.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\uFFF0-\uFFFF]/g, '');
    }

    hasField(field: string): boolean {
        return this.entry.fields.has(field);
    }

    async addAttachment(name: string, data: ArrayBuffer): Promise<void> {
        this.entryModified();
        const binaryRef = await this.file.db.createBinary(data);
        this.entry.binaries.set(name, binaryRef);
        this.fillByEntry();
    }

    removeAttachment(name: string): void {
        this.entryModified();
        this.entry.binaries.delete(name);
        this.fillByEntry();
    }

    getHistory(): Entry[] {
        const history = this.entry.history.map((rec) => new Entry(rec, this.group, this.file));
        history.push(this);
        history.sort((x, y) => (x.updated?.getTime() ?? 0) - (y.updated?.getTime() ?? 0));
        return history;
    }

    deleteHistory(historyEntry: kdbxweb.KdbxEntry): void {
        const ix = this.entry.history.indexOf(historyEntry);
        if (ix >= 0) {
            this.entry.removeHistory(ix);
            this.file.setModified();
        }
        this.fillByEntry();
    }

    revertToHistoryState(historyEntry: kdbxweb.KdbxEntry): void {
        const ix = this.entry.history.indexOf(historyEntry);
        if (ix < 0) {
            return;
        }
        this.entry.pushHistory();
        this.unsaved = true;
        this.file.setModified();
        this.entry.fields = new Map<string, kdbxweb.KdbxEntryField>();
        this.entry.binaries = new Map<string, kdbxweb.KdbxBinary | kdbxweb.KdbxBinaryWithHash>();
        this.entry.copyFrom(historyEntry);
        this.entryModified();
        this.fillByEntry();
    }

    discardUnsaved(): void {
        if (this.unsaved && this.entry.history.length) {
            this.unsaved = false;
            const historyEntry = this.entry.history[this.entry.history.length - 1];
            this.entry.removeHistory(this.entry.history.length - 1);
            this.entry.fields = new Map<string, kdbxweb.KdbxEntryField>();
            this.entry.binaries = new Map<
                string,
                kdbxweb.KdbxBinary | kdbxweb.KdbxBinaryWithHash
            >();
            this.entry.copyFrom(historyEntry);
            this.fillByEntry();
        }
    }

    moveToTrash(): void {
        this.file.setModified();
        if (this.isJustCreated) {
            this.isJustCreated = false;
        }
        this.file.db.remove(this.entry);
        this.file.reload();
    }

    deleteFromTrash(): void {
        this.file.setModified();
        this.file.db.move(this.entry, null);
        this.file.reload();
    }

    removeWithoutHistory(): void {
        if (this.canBeDeleted) {
            const ix = this.group.group.entries.indexOf(this.entry);
            if (ix >= 0) {
                this.group.group.entries.splice(ix, 1);
            }
            this.file.reload();
        }
    }

    detach(): kdbxweb.KdbxEntry {
        this.file.setModified();
        this.file.db.move(this.entry, null);
        this.file.reload();
        return this.entry;
    }

    moveToFile(file: File): void {
        if (this.canBeDeleted) {
            this.removeWithoutHistory();
            this.group = file.groups[0];
            this.file = file;
            this.fillByEntry();
            this.entry.times.update();
            this.group.group.entries.push(this.entry);
            this.group.addEntry(this);
            this.isJustCreated = true;
            this.unsaved = true;
            this.file.setModified();
        }
    }

    initOtpGenerator(): void {
        let otpUrl = this.fields?.get('otp');
        if (otpUrl) {
            if (otpUrl instanceof kdbxweb.ProtectedValue) {
                otpUrl = otpUrl.getText();
            }
            if (Otp.isSecret(otpUrl.replace(/\s/g, ''))) {
                otpUrl = Otp.makeUrl(otpUrl.replace(/\s/g, '').toUpperCase());
            } else if (otpUrl.toLowerCase().lastIndexOf('otpauth:', 0) !== 0) {
                // KeeOTP plugin format
                let key: string | undefined;
                let step: number | undefined;
                let size: number | undefined;
                otpUrl.split('&').forEach((part) => {
                    const parts = part.split('=', 2);
                    const val = decodeURIComponent(parts[1]).replace(/=/g, '');
                    switch (parts[0]) {
                        case 'key':
                            key = val;
                            break;
                        case 'step':
                            step = +val || undefined;
                            break;
                        case 'size':
                            size = +val || undefined;
                            break;
                    }
                });
                if (key) {
                    otpUrl = Otp.makeUrl(key, step, size);
                }
            }
        } else if (this.entry.fields.get('TOTP Seed')) {
            // TrayTOTP plugin format
            let secret = this.entry.fields.get('TOTP Seed');
            if (secret instanceof kdbxweb.ProtectedValue) {
                secret = secret.getText();
            }
            if (secret) {
                let settings = this.entry.fields.get('TOTP Settings');
                if (settings && settings instanceof kdbxweb.ProtectedValue) {
                    settings = settings.getText();
                }
                let period: number | undefined;
                let digits: number | undefined;
                if (settings) {
                    const parts = settings.split(';');
                    if (parts.length > 0 && parts[0]) {
                        period = +parts[0] ?? undefined;
                    }
                    if (parts.length > 1 && parts[1]) {
                        digits = +parts[1] ?? undefined;
                    }
                }
                otpUrl = Otp.makeUrl(secret, period, digits);
                this.fields?.set('otp', kdbxweb.ProtectedValue.fromString(otpUrl));
            }
        }
        if (otpUrl) {
            if (this.otpGenerator && this.otpGenerator.url === otpUrl) {
                return;
            }
            try {
                this.otpGenerator = Otp.parseUrl(otpUrl);
            } catch {
                this.otpGenerator = undefined;
            }
        } else {
            this.otpGenerator = undefined;
        }
    }

    setOtp(otp: Otp): void {
        this.otpGenerator = otp;
        this.setOtpUrl(otp.url);
    }

    setOtpUrl(url: string): void {
        this.setField('otp', url ? kdbxweb.ProtectedValue.fromString(url) : undefined);
        this.entry.fields.delete('TOTP Seed');
        this.entry.fields.delete('TOTP Settings');
    }

    getEffectiveEnableAutoType(): boolean {
        if (typeof this.entry.autoType.enabled === 'boolean') {
            return this.entry.autoType.enabled;
        }
        return this.group.getEffectiveEnableAutoType();
    }

    getEffectiveAutoTypeSeq(): string {
        return this.entry.autoType.defaultSequence || this.group.getEffectiveAutoTypeSeq();
    }

    setEnableAutoType(enabled: boolean): void {
        this.entryModified();
        this.entry.autoType.enabled = enabled;
        this.buildAutoType();
    }

    setAutoTypeObfuscation(enabled: boolean): void {
        this.entryModified();
        this.entry.autoType.obfuscation = enabled
            ? kdbxweb.Consts.AutoTypeObfuscationOptions.UseClipboard
            : kdbxweb.Consts.AutoTypeObfuscationOptions.None;
        this.buildAutoType();
    }

    setAutoTypeSeq(seq: string): void {
        this.entryModified();
        this.entry.autoType.defaultSequence = seq || undefined;
        this.buildAutoType();
    }

    getGroupPath(): string[] {
        let group: Group | undefined = this.group;
        const groupPath: string[] = [];
        while (group?.title) {
            groupPath.unshift(group.title);
            group = group.parentGroup;
        }
        return groupPath;
    }

    cloneEntry(nameSuffix: string): Entry {
        const newEntry = Entry.newEntry(this.group, this.file);
        const uuid = newEntry.entry.uuid;
        newEntry.entry.copyFrom(this.entry);
        newEntry.entry.uuid = uuid;
        newEntry.entry.times.update();
        newEntry.entry.times.creationTime = newEntry.entry.times.lastModTime;
        newEntry.entry.fields.set('Title', `${this.title || ''}${nameSuffix}`);
        newEntry.fillByEntry();
        this.file.reload();
        return newEntry;
    }

    copyFromTemplate(templateEntry: Entry): void {
        const uuid = this.entry.uuid;
        this.entry.copyFrom(templateEntry.entry);
        this.entry.uuid = uuid;
        this.entry.times.update();
        this.entry.times.creationTime = this.entry.times.lastModTime;
        this.entry.fields.set('Title', '');
        this.fillByEntry();
    }

    getRank(filter: Filter): number {
        const searchString = filter.textLower;

        if (!searchString) {
            // no search string given, so rank all items the same
            return 0;
        }

        const checkProtectedFields = filter.advanced && filter.advanced.protect;

        const defaultFieldWeight = 2;

        let rank = 0;
        for (const [field, val] of this.entry.fields) {
            if (!val) {
                continue;
            }
            if (val instanceof kdbxweb.ProtectedValue && (!checkProtectedFields || !val.length)) {
                continue;
            }
            const stringRank = Ranking.getStringRank(searchString, val);
            const fieldWeight = FieldRankWeights.get(field) ?? defaultFieldWeight;
            rank += stringRank * fieldWeight;
        }
        return rank;
    }

    canCheckPasswordIssues(): boolean {
        if (typeof this.entry.qualityCheck === 'boolean') {
            return this.entry.qualityCheck;
        }
        return !this.entry.customData?.has('IgnorePwIssues');
    }

    setIgnorePasswordIssues(): void {
        if (this.file.db.versionIsAtLeast(4, 1)) {
            this.entry.qualityCheck = true;
        } else {
            if (!this.entry.customData) {
                this.entry.customData = new Map();
            }
            this.entry.customData.set('IgnorePwIssues', { value: '1' });
        }
        this.entryModified();
    }

    getNextUrlFieldName(): string {
        const takenFields = new Set(
            [...this.entry.fields.keys()].filter((f) => f.startsWith(ExtraUrlFieldName))
        );
        for (let i = 0; ; i++) {
            const fieldName = i ? `${ExtraUrlFieldName}_${i}` : ExtraUrlFieldName;
            if (!takenFields.has(fieldName)) {
                return fieldName;
            }
        }
    }

    getAllUrls(): string[] {
        const urls = this.url ? [this.url] : [];
        for (const [field, value] of this.fields || []) {
            if (field.startsWith(ExtraUrlFieldName)) {
                const url = value instanceof kdbxweb.ProtectedValue ? value.getText() : value;
                if (url) {
                    urls.push(url);
                }
            }
        }
        return urls;
    }

    static newEntry(group: Group, file: File, opts?: { tag?: string }): Entry {
        const entry = file.db.createEntry(group.group);
        const model = new Entry(entry, group, file);
        if (AppSettings.useGroupIconForEntries && group.icon && group.iconId) {
            entry.icon = group.iconId;
        }
        if (opts?.tag) {
            entry.tags = [opts.tag];
        }
        model.setEntry(entry, group, file);
        model.entry.times.update();
        model.unsaved = true;
        model.isJustCreated = true;
        model.canBeDeleted = true;
        group.addEntry(model);
        file.setModified();
        return model;
    }

    static newEntryWithFields(group: Group, fields: Map<string, kdbxweb.KdbxEntryField>): Entry {
        const entry = Entry.newEntry(group, group.file);
        for (const [field, value] of fields) {
            entry.setField(field, value);
        }
        return entry;
    }
}

export { Entry, ExtraUrlFieldName };
