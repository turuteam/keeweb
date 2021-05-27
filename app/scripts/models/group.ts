import * as kdbxweb from 'kdbxweb';
import { IconMap } from 'const/icon-map';
import { Entry } from 'models/entry';
import { File } from 'models/file';
import { MenuItem } from 'models/menu/menu-item';
import { IconUrlFormat } from 'util/formatting/icon-url-format';
import { Filter } from 'models/filter';
import { NonFunctionPropertyNames } from 'util/types';

const KdbxIcons = kdbxweb.Consts.Icons;

const DefaultAutoTypeSequence = '{USERNAME}{TAB}{PASSWORD}{ENTER}';

class Group extends MenuItem {
    readonly id: string;
    readonly uuid: string;
    iconId?: number;
    entries: Entry[] = [];
    items: Group[] = [];
    filterKey?: NonFunctionPropertyNames<Filter> = 'group';
    editable = true;
    top = false;
    drag = true;
    drop = true;
    enableSearching?: boolean | null;
    enableAutoType?: boolean | null;
    autoTypeSeq?: string;
    group: kdbxweb.KdbxGroup;
    file: File;
    parentGroup?: Group;
    customIcon?: string;
    customIconId?: string;
    isJustCreated = false;

    constructor(group: kdbxweb.KdbxGroup, file: File, parentGroup: Group | undefined) {
        super();

        this.id = file.subId(group.uuid.id);
        this.uuid = group.uuid.id;
        this.group = group;
        this.file = file;
        this.parentGroup = parentGroup;

        this.setGroup(group, file, parentGroup);
    }

    setGroup(group: kdbxweb.KdbxGroup, file: File, parentGroup: Group | undefined): void {
        if (group.uuid.id !== this.uuid) {
            throw new Error('Cannot change group uuid');
        }

        const isRecycleBin = group.uuid.equals(file.db.meta.recycleBinUuid);
        const id = file.subId(group.uuid.id);
        this.batchSet(() => {
            this.expanded = group.expanded ?? true;
            this.visible = !isRecycleBin;
            this.items = [];
            this.entries = [];
            this.filterValue = id;
            this.enableSearching = group.enableSearching;
            this.enableAutoType = group.enableAutoType;
            this.autoTypeSeq = group.defaultAutoTypeSeq;
            this.top = !parentGroup;
            this.drag = !!parentGroup;
            this.collapsible = !!parentGroup;
        });
        this.group = group;
        this.file = file;
        this.parentGroup = parentGroup;
        this.fillByGroup();

        for (const subGroup of group.groups) {
            let g = file.getGroup(file.subId(subGroup.uuid.id));
            if (g) {
                g.setGroup(subGroup, file, this);
            } else {
                g = new Group(subGroup, file, this);
            }
            this.items.push(g);
        }

        for (const entry of group.entries) {
            let e = file.getEntry(file.subId(entry.uuid.id));
            if (e) {
                e.setEntry(entry, this, file);
            } else {
                e = new Entry(entry, this, file);
            }
            this.entries.push(e);
        }
    }

    private fillByGroup() {
        this.batchSet(() => {
            this.title = this.parentGroup ? this.group.name : this.file.name;
            this.iconId = this.group.icon;
            this.icon = Group.iconFromId(this.group.icon);
            this.customIcon = this.buildCustomIcon() ?? undefined;
            this.customIconId = this.group.customIcon?.id;
            this.expanded = this.group.expanded !== false;
        });
    }

    private static iconFromId(id: number | undefined): string | undefined {
        if (id === undefined || id === KdbxIcons.Folder || id === KdbxIcons.FolderOpen) {
            return undefined;
        }
        return IconMap[id];
    }

    private buildCustomIcon(): string | null {
        if (this.group.customIcon) {
            const customIcon = this.file.db.meta.customIcons.get(this.group.customIcon.id);
            if (customIcon) {
                return IconUrlFormat.toDataUrl(customIcon.data);
            }
        }
        return null;
    }

    private groupModified() {
        if (this.isJustCreated) {
            this.isJustCreated = false;
        }
        this.file.setModified();
        this.group.times.update();
    }

    *parentGroups(): Generator<Group> {
        let group = this.parentGroup;
        while (group) {
            yield group;
            group = group.parentGroup;
        }
    }

    *parentGroupsIncludingSelf(): Generator<Group> {
        yield this;
        yield* this.parentGroups();
    }

    *allGroupsMatching(filter: Filter): Generator<Group> {
        for (const group of this.items) {
            if (group.matches(filter)) {
                yield group;
                yield* group.allGroupsMatching(filter);
            }
        }
    }

    *ownEntriesMatching(filter: Filter): Generator<Entry> {
        for (const entry of this.entries) {
            if (entry.matches(filter)) {
                yield entry;
            }
        }
    }

    matches(filter: Filter): boolean {
        return (
            ((filter && filter.includeDisabled) ||
                (this.group.enableSearching !== false &&
                    !this.group.uuid.equals(this.file.db.meta.entryTemplatesGroup))) &&
            (!filter || !filter.autoType || this.group.enableAutoType !== false)
        );
    }

    addEntry(entry: Entry): void {
        this.entries.push(entry);
    }

    addGroup(group: Group): void {
        this.items.push(group);
    }

    setName(name: string): void {
        this.groupModified();
        this.group.name = name;
        this.fillByGroup();
    }

    setIcon(iconId: number): void {
        this.groupModified();
        this.group.icon = iconId;
        this.group.customIcon = undefined;
        this.fillByGroup();
    }

    setCustomIcon(customIconId: string): void {
        this.groupModified();
        this.group.customIcon = new kdbxweb.KdbxUuid(customIconId);
        this.fillByGroup();
    }

    setExpanded(expanded: boolean): void {
        // this._groupModified(); // it's not good to mark the file as modified when a group is collapsed
        this.group.expanded = expanded;
        this.expanded = expanded;
    }

    setEnableSearching(enabled: boolean | null): void {
        this.groupModified();
        let parentEnableSearching = true;
        for (const parentGroup of this.parentGroups()) {
            if (typeof parentGroup.enableSearching === 'boolean') {
                parentEnableSearching = parentGroup.enableSearching;
                break;
            }
        }
        if (enabled === parentEnableSearching) {
            enabled = null;
        }
        this.group.enableSearching = enabled;
        this.enableSearching = this.group.enableSearching;
    }

    getEffectiveEnableSearching(): boolean {
        for (const grp of this.parentGroupsIncludingSelf()) {
            if (typeof grp.enableSearching === 'boolean') {
                return grp.enableSearching;
            }
        }
        return true;
    }

    setEnableAutoType(enabled: boolean | null): void {
        this.groupModified();
        let parentEnableAutoType = true;
        for (const parentGroup of this.parentGroups()) {
            if (typeof parentGroup.enableAutoType === 'boolean') {
                parentEnableAutoType = parentGroup.enableAutoType;
                break;
            }
        }
        if (enabled === parentEnableAutoType) {
            enabled = null;
        }
        this.group.enableAutoType = enabled;
        this.enableAutoType = this.group.enableAutoType;
    }

    getEffectiveEnableAutoType(): boolean {
        for (const grp of this.parentGroupsIncludingSelf()) {
            if (typeof grp.enableAutoType === 'boolean') {
                return grp.enableAutoType;
            }
        }
        return true;
    }

    setAutoTypeSeq(seq: string | undefined): void {
        this.groupModified();
        this.group.defaultAutoTypeSeq = seq || undefined;
        this.autoTypeSeq = this.group.defaultAutoTypeSeq;
    }

    getEffectiveAutoTypeSeq(): string {
        for (const grp of this.parentGroupsIncludingSelf()) {
            if (grp.autoTypeSeq) {
                return grp.autoTypeSeq;
            }
        }
        return DefaultAutoTypeSequence;
    }

    getParentEffectiveAutoTypeSeq(): string {
        return this.parentGroup
            ? this.parentGroup.getEffectiveAutoTypeSeq()
            : DefaultAutoTypeSequence;
    }

    isEntryTemplatesGroup(): boolean {
        return this.group.uuid.equals(this.file.db.meta.entryTemplatesGroup);
    }

    moveToTrash(): void {
        this.file.setModified();
        this.file.db.remove(this.group);
        if (this.group.uuid.equals(this.file.db.meta.entryTemplatesGroup)) {
            this.file.db.meta.entryTemplatesGroup = undefined;
        }
        this.file.reload();
    }

    deleteFromTrash(): void {
        this.file.db.move(this.group, null);
        this.file.reload();
    }

    removeWithoutHistory(): void {
        if (!this.parentGroup) {
            return;
        }
        const ix = this.parentGroup.group.groups.indexOf(this.group);
        if (ix >= 0) {
            this.parentGroup.group.groups.splice(ix, 1);
        }
        this.file.reload();
    }

    moveHere(object: Group | Entry): void {
        if (!object || object.id === this.id) {
            return;
        }
        if (object.file === this.file) {
            this.file.setModified();
            if (object instanceof Group) {
                for (const parent of this.parentGroupsIncludingSelf()) {
                    if (object === parent) {
                        return;
                    }
                }
                if (this.group.groups.indexOf(object.group) >= 0) {
                    return;
                }
                this.file.db.move(object.group, this.group);
                this.file.reload();
            } else {
                if (this.group.entries.indexOf(object.entry) >= 0) {
                    return;
                }
                this.file.db.move(object.entry, this.group);
                this.file.reload();
            }
        } else if (object instanceof Entry) {
            this.file.setModified();
            const detachedEntry = object.detach();
            this.file.db.importEntry(detachedEntry, this.group, object.file.db);
            this.file.reload();
        } else {
            // moving groups between files is not supported for now
        }
    }

    moveToTop(object: Group): void {
        if (!object || object.id === this.id || object.file !== this.file || !this.parentGroup) {
            return;
        }
        this.file.setModified();
        for (const parent of this.parentGroupsIncludingSelf()) {
            if (object === parent) {
                return;
            }
        }
        let atIndex = this.parentGroup.group.groups.indexOf(this.group);
        const selfIndex = this.parentGroup.group.groups.indexOf(object.group);
        if (selfIndex >= 0 && selfIndex < atIndex) {
            atIndex--;
        }
        if (atIndex >= 0) {
            this.file.db.move(object.group, this.parentGroup.group, atIndex);
        }
        this.file.reload();
    }

    static newGroup(parentGroup: Group, file: File): Group {
        const grp = file.db.createGroup(parentGroup.group, '');
        const model = new Group(grp, file, parentGroup);

        model.group.times.update();
        model.isJustCreated = true;

        parentGroup.addGroup(model);
        file.setModified();
        file.reload();

        return model;
    }
}

export { Group };
