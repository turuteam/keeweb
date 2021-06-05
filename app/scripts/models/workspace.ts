import { Model } from 'util/model';
import { AdvancedFilter, DefaultAdvancedFilter, Filter } from 'models/filter';
import { File } from 'models/file';
import { Menu } from 'models/menu/menu';
import { FileManager } from 'models/file-manager';
import { MenuItem } from 'models/menu/menu-item';
import { AppSettings } from 'models/app-settings';
import { IdGenerator } from 'util/generators/id-generator';
import { KeyHandler } from 'comp/browser/key-handler';
import { Keys } from 'const/keys';
import { OpenState } from 'models/open-state';
import { Query } from 'models/query';

export type WorkspaceMode = 'open' | 'list' | 'settings' | 'panel';

export type SettingsPage =
    | 'general'
    | 'shortcuts'
    | 'browser'
    | 'plugins'
    | 'devices'
    | 'about'
    | 'help'
    | 'file';

class Workspace extends Model {
    readonly menu = new Menu();
    readonly query = new Query();
    mode: WorkspaceMode = 'open';
    tags: string[] = [];
    activeItemId?: string;
    unlockMessage?: string;
    lastAdvancedFilter: AdvancedFilter = DefaultAdvancedFilter;

    constructor() {
        super();

        FileManager.onChange('files', () => this.filesChanged());
        FileManager.on('file-added', (id) => this.fileAdded(id));
        (this as Workspace).onChange('mode', (mode, prevMode) => this.modeChanged(mode, prevMode));
        this.query.filter.onChange('advanced', (adv) => this.advancedFilterChanged(adv));

        this.query.on('results-updated', () => this.queryResultsUpdated());

        this.setKeyHandlers();
    }

    closeAllFiles(): void {
        FileManager.closeAll();
        this.selectAllItems();
    }

    closeFile(file: File): void {
        FileManager.close(file);
        this.selectAllItems();
    }

    async createDemoFile(): Promise<void> {
        if (!FileManager.getFileByName('Demo')) {
            const demoFile = await File.openDemo();
            FileManager.addFile(demoFile);
            AppSettings.demoOpened = true;
        }
        this.showList();
    }

    async createNewFile(name?: string): Promise<void> {
        if (!name) {
            name = FileManager.getNewFileName();
        }

        const newFile = await File.create(IdGenerator.uuid(), name);
        FileManager.addFile(newFile);

        this.showList();
    }

    async importFileFromXml(name: string, xml: string): Promise<void> {
        const file = await File.importWithXml(IdGenerator.uuid(), name, xml);
        FileManager.addFile(file);

        this.showList();
    }

    selectAllItems(): void {
        this.menu.select(this.menu.allItemsItem);
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
        this.query.updateResults();
    }

    selectEntry(entryId: string): void {
        this.activeItemId = entryId;
    }

    lockWorkspace(): void {
        if (!FileManager.hasOpenFiles) {
            return;
        }
        this.closeAllFiles(); // TODO: implement locking from app-view
        this.showOpen();
        this.query.reset();
    }

    toggleOpen(): void {
        if (this.mode === 'open') {
            this.showList();
        } else {
            this.showOpen();
        }
    }

    toggleSettings(page?: SettingsPage, anchor?: string, fileId?: string): void {
        if (this.mode === 'settings') {
            if (
                (!page || this.menu.selectedItem.page === page) &&
                (!page || !fileId || this.menu.selectedItem.file?.id === fileId)
            ) {
                if (FileManager.hasOpenFiles) {
                    this.showList();
                } else {
                    this.showOpen();
                }
            } else {
                this.showSettings(page, anchor, fileId);
            }
        } else {
            this.showSettings(page, anchor, fileId);
        }
    }

    showList() {
        if (FileManager.hasOpenFiles) {
            this.mode = 'list';
        }
    }

    showOpen(): void {
        OpenState.init();
        this.mode = 'open';
    }

    showSettings(page: SettingsPage = 'general', anchor?: string, fileId?: string): void {
        this.mode = 'settings';
        this.menu.selectSettingsPage(page, anchor, fileId);
    }

    modeChanged(mode: WorkspaceMode, prevMode: WorkspaceMode) {
        if (mode === 'settings') {
            this.menu.setMenu('settings');
        } else if (prevMode === 'settings') {
            this.menu.setMenu('app');
        }
    }

    private fileAdded(id: string) {
        const file = FileManager.getFileById(id);
        if (!file) {
            return;
        }

        this.query.updateResults();

        file.on('reload', () => this.reloadFile(file));
        file.on('ejected', () => this.closeFile(file));
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
            this.menu.tagsSection.items = this.tags.map((tag) => Menu.newTagItem(tag));
        } else {
            this.menu.tagsSection.scrollable = false;
            this.menu.tagsSection.removeAllItems();
        }
    }

    private setKeyHandlers(): void {
        KeyHandler.onKey(
            Keys.DOM_VK_L,
            () => this.lockWorkspace(),
            KeyHandler.SHORTCUT_ACTION,
            undefined,
            true
        );
        KeyHandler.onKey(
            Keys.DOM_VK_L,
            () => this.lockWorkspace(),
            KeyHandler.SHORTCUT_OPT,
            undefined,
            true
        );

        KeyHandler.onKey(Keys.DOM_VK_O, () => this.toggleOpen(), KeyHandler.SHORTCUT_ACTION);
        KeyHandler.onKey(
            Keys.DOM_VK_COMMA,
            () => this.showSettings(),
            KeyHandler.SHORTCUT_ACTION,
            'open'
        );
    }

    private queryResultsUpdated() {
        if (!this.activeItemId || !this.query.hasItem(this.activeItemId)) {
            this.activeItemId = this.query.groups[0]?.id ?? this.query.entries[0]?.id;
        }
    }

    private advancedFilterChanged(adv: AdvancedFilter | undefined) {
        if (adv) {
            this.lastAdvancedFilter = adv;
        }
    }
}

const instance = new Workspace();

export { instance as Workspace };
