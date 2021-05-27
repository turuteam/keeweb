import { Model } from 'util/model';
import { Filter } from 'models/filter';
import { File } from 'models/file';
import { Menu } from 'models/menu/menu';
import { FileManager } from 'models/file-manager';
import { MenuItem } from 'models/menu/menu-item';
import { AppSettings } from 'models/app-settings';
import { IdGenerator } from 'util/generators/id-generator';

export type WorkspaceMode = 'open' | 'list' | 'settings' | 'panel';

class Workspace extends Model {
    readonly menu = new Menu();
    mode: WorkspaceMode = 'open';
    filter = new Filter();
    tags: string[] = [];
    activeEntryId?: string;
    unlockMessage?: string;

    constructor() {
        super();

        FileManager.onChange('files', () => this.filesChanged());
    }

    addFile(file: File): void {
        this.refresh();
        FileManager.addFile(file);

        file.on('reload', () => this.reloadFile(file));
        file.on('ejected', () => this.closeFile(file));
    }

    closeAllFiles(): void {
        FileManager.closeAll();

        this.filter = new Filter();
        this.selectShowAllMenuItem();
    }

    closeFile(file: File): void {
        FileManager.close(file);

        this.selectShowAllMenuItem();
    }

    async createDemoFile(): Promise<void> {
        if (!FileManager.getFileByName('Demo')) {
            const demoFile = await File.openDemo();
            FileManager.addFile(demoFile);
        }
        this.mode = 'list';
    }

    async createNewFile(name?: string): Promise<void> {
        if (!name) {
            name = FileManager.getNewFileName();
        }

        const newFile = await File.create(IdGenerator.uuid(), name);
        FileManager.addFile(newFile);

        this.mode = 'list';
    }

    selectShowAllMenuItem(): void {
        this.menu.select({ item: this.menu.allItemsItem });
    }

    renameTag(from: string, to: string): void {
        for (const file of FileManager.files) {
            file.renameTag(from, to);
        }
        this.updateTags();
    }

    emptyTrash(): void {
        for (const file of FileManager.files) {
            file.emptyTrash();
        }
        this.refresh();
    }

    selectEntry(entryId: string): void {
        this.activeEntryId = entryId;
        this.refresh();
    }

    refresh(): void {
        this.setFilter(this.filter);
    }

    lockWorkspace(): void {
        this.closeAllFiles(); // TODO: implement locking from app-view
        this.mode = 'open';
    }

    toggleOpen(): void {
        this.mode = this.mode === 'open' ? 'list' : 'open';
    }

    private filesChanged() {
        this.updateTags();

        const groupsSectionItems: MenuItem[] = [];
        const filesSectionItems: MenuItem[] = [];

        for (const file of FileManager.files) {
            const groupsItem = this.menu.groupsSection.items.find((it) => it.file === file);
            const filesItem = this.menu.filesSection.items.find((it) => it.file === file);

            if (groupsItem) {
                groupsSectionItems.push(groupsItem);
            } else if (file.groups.length) {
                groupsSectionItems.push(file.groups[0]);
            }

            if (filesItem) {
                filesSectionItems.push(filesItem);
            } else {
                filesSectionItems.push(
                    new MenuItem({
                        icon: 'lock',
                        title: file.name,
                        page: 'file',
                        file
                    })
                );
            }
        }

        this.menu.groupsSection.items = groupsSectionItems;
        this.menu.filesSection.items = filesSectionItems;
    }

    private reloadFile(file: File) {
        this.menu.groupsSection.items = this.menu.groupsSection.items.map((it) =>
            it.file === file ? file.groups[0] : it
        );
        this.updateTags();
    }

    private updateTags() {
        const newTags = [];
        const tagSetLower = new Set<string>();
        for (const file of FileManager.files) {
            for (const tag of this.getTags(file)) {
                const tagLower = tag.toLowerCase();
                if (!tagSetLower.has(tagLower)) {
                    tagSetLower.add(tagLower);
                    newTags.push(tag);
                }
            }
        }
        newTags.sort();

        if (this.tags.join(',') !== newTags.join(',')) {
            this.tags = newTags;
            this.tagsChanged();
        }
    }

    private getTags(file: File) {
        const tags = new Set<string>();
        for (const entry of file.entriesMatching(new Filter())) {
            if (entry.tags) {
                for (const tag of entry.tags) {
                    tags.add(tag);
                }
            }
        }
        return tags;
    }

    private tagsChanged() {
        if (this.tags.length) {
            this.menu.tagsSection.scrollable = true;
            this.menu.tagsSection.items = this.tags.map(
                (tag) =>
                    new MenuItem({
                        title: tag,
                        icon: 'tag',
                        filterKey: 'tag',
                        filterValue: tag,
                        editable: true
                    })
            );
        } else {
            this.menu.tagsSection.scrollable = false;
            this.menu.tagsSection.removeAllItems();
        }
    }

    private setFilter(filter: Filter): void {
        this.prepareFilter(filter);
        this.filter = filter;
        this.filter.subGroups = AppSettings.expandGroups;
        // if (!this.filter.advanced && this.advancedSearch) { // TODO: advanced search
        //     this.filter.advanced = this.advancedSearch;
        // }
        // const entries = this.getEntries(); // TODO: filtering
        // if (!this.activeEntryId || !entries.get(this.activeEntryId)) {
        //     const firstEntry = entries[0];
        //     this.activeEntryId = firstEntry ? firstEntry.id : null;
        // }
        // Events.emit('filter', { filter: this.filter, sort: this.sort, entries });
        // Events.emit('entry-selected', entries.get(this.activeEntryId));
    }

    private prepareFilter(filter: Filter): void {
        filter.textLower = filter.text ? filter.text.toLowerCase() : '';
        filter.textParts = undefined;
        filter.textLowerParts = undefined;

        const exact = filter.advanced?.exact;
        if (!exact && filter.text) {
            const textParts = filter.text.split(/\s+/).filter((s) => s);
            if (textParts.length) {
                filter.textParts = textParts;
                filter.textLowerParts = filter.textLower.split(/\s+/).filter((s) => s);
            }
        }

        filter.tagLower = filter.tag ? filter.tag.toLowerCase() : '';
    }
}

const instance = new Workspace();

export { instance as Workspace };
