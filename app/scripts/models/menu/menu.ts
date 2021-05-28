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

type MenuType = 'app' | 'settings';

class Menu extends Model {
    private readonly _menus = {} as Record<MenuType, MenuSection[]>;

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
            shortcut: Keys.DOM_VK_A
            // filterKey: '*'
        });
        this.allItemsSection = new MenuSection(this.allItemsItem);

        this.groupsSection = new MenuSection();
        this.groupsSection.scrollable = true;
        this.groupsSection.grow = true;

        this.colorsItem = new MenuItem({
            locTitle: 'menuColors',
            icon: 'bookmark',
            shortcut: Keys.DOM_VK_C,
            cls: 'menu__item-colors',
            filterKey: 'color',
            filterValue: true
        });
        this.colorsSection = new MenuSection(this.colorsItem);

        const defTagItem = this.getDefaultTagItem();
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
                filterKey: 'trash',
                filterValue: true,
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
                section: 'top',
                active: true
            }),
            new MenuItem({
                locTitle: 'setGenAppearance',
                icon: '0',
                page: 'general',
                section: 'appearance'
            }),
            new MenuItem({
                locTitle: 'setGenFunction',
                icon: '0',
                page: 'general',
                section: 'function'
            }),
            new MenuItem({
                locTitle: 'setGenAudit',
                icon: '0',
                page: 'general',
                section: 'audit'
            }),
            new MenuItem({
                locTitle: 'setGenLock',
                icon: '0',
                page: 'general',
                section: 'lock'
            }),
            new MenuItem({
                locTitle: 'setGenStorage',
                icon: '0',
                page: 'general',
                section: 'storage'
            }),
            new MenuItem({
                locTitle: 'advanced',
                icon: '0',
                page: 'general',
                section: 'advanced'
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

        this.setLocale();
    }

    select(sel: { item: MenuItem; option?: MenuOption }): void {
        const sections = this.sections;
        for (const it of this.allItems()) {
            it.active = it === sel.item;
        }
        if (sections === this._menus.app) {
            this.colorsItem.options?.forEach((opt) => {
                opt.active = opt === sel.option;
            });
            this.colorsItem.iconCls =
                sel.item === this.colorsItem && sel.option
                    ? `${sel.option.value}-color`
                    : undefined;
            // TODO: set the filter
            // const filterKey = sel.item.filterKey;
            // const filterValue = (sel.option || sel.item).filterValue;
            // const filter = {};
            // filter[filterKey] = filterValue;
            // Events.emit('set-filter', filter);
        } else if (sections === this._menus.settings && sel.item.page) {
            // TODO: switch settings page
            // Events.emit('set-page', {
            //     page: sel.item.page,
            //     section: sel.item.section,
            //     file: sel.item.file
            // });
        }
    }

    private *visibleItems() {
        for (const section of this.sections) {
            if (!section.visible) {
                continue;
            }
            for (const item of section.items) {
                yield* Menu.allItemsWithin(item);
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
            previousItem = item;
            if (item.active && previousItem) {
                this.select({ item: previousItem });
                break;
            }
        }
    }

    selectNext(): void {
        let activeItem: MenuItem | undefined;

        for (const item of this.visibleItems()) {
            if (item.active) {
                activeItem = item;
            } else if (activeItem) {
                this.select({ item });
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
        this.tagsSection?.setDefaultItems(this.getDefaultTagItem());
    }

    private getDefaultTagItem(): MenuItem {
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

    setMenu(type: MenuType): void {
        this.sections = this._menus[type];
    }
}

export { Menu };
