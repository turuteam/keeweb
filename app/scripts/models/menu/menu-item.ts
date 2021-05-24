import { Model } from 'util/model';
import { MenuOption } from './menu-option';
import { Keys } from 'const/keys';
import { AlertConfig } from 'comp/ui/alerts';
import { Locale } from 'util/locale';
import { InitWithFieldsOf } from 'util/types';

class MenuItem extends Model {
    id?: string;
    title?: string;
    locTitle?: keyof typeof Locale;
    icon?: string;
    // customIcon?: null; // TODO(ts): custom icons
    active = false;
    expanded = true;
    items: MenuItem[] = [];
    shortcut?: Keys;
    options?: MenuOption[];
    cls?: string;
    iconCls?: string;
    disabledAlert?: AlertConfig;
    visible = true;
    drag = false;
    drop = false;
    filterKey?: string;
    filterValue?: string | true;
    collapsible = false;
    defaultItem = false;
    page?: string;
    editable = false;
    // file: null; // TODO(ts): files in the menu
    section?: string;

    constructor(values: InitWithFieldsOf<MenuItem>) {
        super();
        Object.assign(this, values);

        // if (model && model.file) { // TODO(ts): files in the menu
        //     model.file.on('change:name', () => this.title = newName);
        // }
    }

    addItem(item: MenuItem): void {
        this.items.push(item);
    }

    addOption(option: MenuOption): void {
        if (!this.options) {
            this.options = [];
        }
        this.options.push(new MenuOption(option));
    }

    toggleExpanded(): void {
        const items = this.items;
        let expanded = !this.expanded;
        if (!items || !items.length) {
            expanded = true;
        }
        this.expanded = expanded;
    }
}

export { MenuItem };
