import { Model } from 'util/model';
import { MenuItem } from './menu-item';
import { IdGenerator } from 'util/generators/id-generator';

class MenuSection extends Model {
    id = IdGenerator.uuid();
    defaultItems?: MenuItem[];
    items: MenuItem[];
    scrollable = false;
    grow = false;
    drag = false;
    visible = true;
    active = false;
    height?: number;

    constructor(...items: MenuItem[]) {
        super();
        this.items = [...items];
    }

    addItem(item: MenuItem): void {
        this.items = [...this.items, item];
    }

    removeAllItems(): void {
        this.items = this.defaultItems ? [...this.defaultItems] : [];
    }

    setDefaultItems(...items: MenuItem[]): void {
        this.defaultItems = [...items];
    }
}

export { MenuSection };
