import { Model } from 'util/model';
import { Events } from 'util/events';
import { Colors } from 'const/colors';
import { Keys } from 'const/keys';
import { MenuSection } from './menu-section';
import { StringFormat } from 'util/formatting/string-format';
import { Locale } from 'util/locale';
import { Launcher } from 'comp/launcher';
import { Features } from 'util/features';
import { MenuItem } from './menu-item';
import { MenuOption } from './menu-option';
import { AppSettings } from 'models/app-settings';
import { KeyHandler } from 'comp/browser/key-handler';
import { SettingsPage } from 'models/workspace';

type MenuType = 'app' | 'settings';

class Menu extends Model {
    private readonly _menus = {} as Record<MenuType, MenuSection[]>;
    selectedItem: MenuItem;

    sections: MenuSection[];

    allItemsItem: MenuItem;
    allItemsSection: MenuSection;
    groupsSection: MenuSection;
    colorsItem: MenuItem;
    colorsSection: MenuSection;
    tagsSection: MenuSection;
    trashSection: MenuSection;

    generalSection: MenuSection;
    shortcutsSection: MenuSection;
    browserSection?: MenuSection;
    pluginsSection: MenuSection;
    devicesSection?: MenuSection;
    aboutSection: MenuSection;
    helpSection: MenuSection;
    filesSection: MenuSection;

    constructor() {
        super();

        this.sections = [];

        this.allItemsItem = new MenuItem({
            locTitle: 'menuAllItems',
            icon: 'th-large',
            active: true,
            shortcut: Keys.DOM_VK_A,
            filter: { type: 'all' }
        });
        this.allItemsSection = new MenuSection(this.allItemsItem);
        this.selectedItem = this.allItemsItem;

        this.groupsSection = new MenuSection();
        this.groupsSection.scrollable = true;
        this.groupsSection.grow = true;

        this.colorsItem = new MenuItem({
            locTitle: 'menuColors',
            icon: 'bookmark',
            shortcut: Keys.DOM_VK_C,
            cls: 'menu__item-colors',
            filter: { type: 'color', value: '*' }
        });
        this.colorsSection = new MenuSection(this.colorsItem);

        const defTagItem = Menu.getDefaultTagItem();
        this.tagsSection = new MenuSection(defTagItem);
        this.tagsSection.setDefaultItems(defTagItem);
        this.tagsSection.scrollable = true;
        this.tagsSection.drag = true;
        this.tagsSection.height = AppSettings.tagsViewHeight ?? undefined;

        this.trashSection = new MenuSection(
            new MenuItem({
                locTitle: 'menuTrash',
                icon: 'trash-alt',
                shortcut: Keys.DOM_VK_D,
                filter: { type: 'trash' },
                drop: true
            })
        );

        Colors.AllColors.forEach((color) => {
            this.colorsSection.items[0].addOption(
                new MenuOption({
                    cls: `fa ${color}-color`,
                    value: color,
                    filterValue: color
                })
            );
        });

        this._menus.app = [
            this.allItemsSection,
            this.colorsSection,
            this.tagsSection,
            this.groupsSection,
            this.trashSection
        ];

        this.generalSection = new MenuSection(
            new MenuItem({
                locTitle: 'menuSetGeneral',
                icon: 'cog',
                page: 'general',
                anchor: undefined,
                active: true
            }),
            new MenuItem({
                locTitle: 'setGenAppearance',
                icon: '0',
                page: 'general',
                anchor: 'appearance'
            }),
            new MenuItem({
                locTitle: 'setGenFunction',
                icon: '0',
                page: 'general',
                anchor: 'function'
            }),
            new MenuItem({
                locTitle: 'setGenAudit',
                icon: '0',
                page: 'general',
                anchor: 'audit'
            }),
            new MenuItem({
                locTitle: 'setGenLock',
                icon: '0',
                page: 'general',
                anchor: 'lock'
            }),
            new MenuItem({
                locTitle: 'setGenStorage',
                icon: '0',
                page: 'general',
                anchor: 'storage'
            }),
            new MenuItem({
                locTitle: 'advanced',
                icon: '0',
                page: 'general',
                anchor: 'advanced'
            })
        );

        this.shortcutsSection = new MenuSection(
            new MenuItem({ locTitle: 'shortcuts', icon: 'keyboard', page: 'shortcuts' })
        );
        if (Features.supportsBrowserExtensions) {
            this.browserSection = new MenuSection(
                new MenuItem({
                    locTitle: 'menuSetBrowser',
                    icon: Features.browserIcon,
                    page: 'browser'
                })
            );
        }
        this.pluginsSection = new MenuSection(
            new MenuItem({ locTitle: 'plugins', icon: 'puzzle-piece', page: 'plugins' })
        );
        if (Launcher) {
            this.devicesSection = new MenuSection(
                new MenuItem({ locTitle: 'menuSetDevices', icon: 'usb', page: 'devices' })
            );
        }
        this.aboutSection = new MenuSection(
            new MenuItem({ locTitle: 'menuSetAbout', icon: 'info', page: 'about' })
        );
        this.helpSection = new MenuSection(
            new MenuItem({ locTitle: 'help', icon: 'question', page: 'help' })
        );
        this.filesSection = new MenuSection();
        this.filesSection.scrollable = true;
        this.filesSection.grow = true;

        this._menus.settings = [
            this.generalSection,
            this.shortcutsSection,
            this.browserSection,
            this.pluginsSection,
            this.devicesSection,
            this.aboutSection,
            this.helpSection,
            this.filesSection
        ].filter((s): s is MenuSection => !!s);

        this.sections = this._menus.app;

        Events.on('locale-changed', () => this.setLocale());
        AppSettings.onChange('tagsViewHeight', (tagsViewHeight) => {
            this.tagsSection.height = tagsViewHeight ?? undefined;
        });

        KeyHandler.onKey(
            Keys.DOM_VK_UP,
            () => this.selectPrevious(),
            KeyHandler.SHORTCUT_ACTION + KeyHandler.SHORTCUT_OPT
        );

        KeyHandler.onKey(
            Keys.DOM_VK_DOWN,
            () => this.selectNext(),
            KeyHandler.SHORTCUT_ACTION + KeyHandler.SHORTCUT_OPT
        );

        this.setLocale();
    }

    select(item: MenuItem, option?: MenuOption): void {
        const sections = this.sections;
        for (const it of this.allItems()) {
            it.active = it === item;
            if (it.active) {
                this.selectedItem = it;
            }
        }
        if (sections === this._menus.app) {
            this.colorsItem.options?.forEach((opt) => {
                opt.active = opt === option;
            });
            this.colorsItem.iconCls =
                item === this.colorsItem && option ? `${option.value}-color` : undefined;
        }
    }

    selectSettingsPage(page: SettingsPage, anchor?: string, fileId?: string): void {
        for (const section of this._menus.settings) {
            for (const it of section.items) {
                it.active =
                    it.page === page && anchor === it.anchor && (!fileId || fileId === it.file?.id);
                if (it.active) {
                    this.selectedItem = it;
                }
            }
        }
    }

    private *visibleItems() {
        for (const section of this.sections) {
            if (!section.visible) {
                continue;
            }
            for (const item of section.items) {
                for (const subItem of Menu.allItemsWithin(item)) {
                    if (subItem.visible) {
                        yield subItem;
                    }
                }
            }
        }
    }

    private *allItems() {
        for (const section of this.sections) {
            for (const item of section.items) {
                yield* Menu.allItemsWithin(item);
            }
        }
    }

    private static *allItemsWithin(item: MenuItem): Generator<MenuItem> {
        yield item;
        for (const it of item.items) {
            yield* this.allItemsWithin(it);
        }
    }

    selectPrevious(): void {
        let previousItem: MenuItem | undefined;

        for (const item of this.visibleItems()) {
            if (item.active && previousItem) {
                this.select(previousItem);
                return;
            }
            previousItem = item;
        }
    }

    selectNext(): void {
        let activeItem: MenuItem | undefined;

        for (const item of this.visibleItems()) {
            if (item.active) {
                activeItem = item;
            } else if (activeItem) {
                this.select(item);
                return;
            }
        }
    }

    private setLocale() {
        for (const menu of [this._menus.app, this._menus.settings]) {
            for (const section of menu) {
                for (const item of section.items) {
                    if (item.locTitle) {
                        item.title = StringFormat.capFirst(Locale.get(item.locTitle));
                    }
                }
            }
        }
        this.tagsSection?.setDefaultItems(Menu.getDefaultTagItem());
    }

    setMenu(type: MenuType): void {
        this.sections = this._menus[type];
    }

    private static getDefaultTagItem(): MenuItem {
        return new MenuItem({
            title: StringFormat.capFirst(Locale.tags),
            icon: 'tags',
            defaultItem: true,
            disabled: true,
            disabledAlert: {
                header: Locale.menuAlertNoTags,
                body: Locale.menuAlertNoTagsBody,
                icon: 'tags'
            }
        });
    }

    static newTagItem(tag: string): MenuItem {
        return new MenuItem({
            title: tag,
            icon: 'tag',
            filter: { type: 'tag', value: tag },
            editable: true
        });
    }
}

export { Menu };
