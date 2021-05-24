import { Model } from 'util/model';

class MenuOption extends Model {
    title?: string;
    cls: string;
    value: string;
    filterValue: string;
    active = false;

    constructor({
        title,
        cls,
        value,
        filterValue
    }: {
        title?: string;
        cls: string;
        value: string;
        filterValue: string;
    }) {
        super();
        this.title = title;
        this.cls = cls;
        this.value = value;
        this.filterValue = filterValue;
    }
}

export { MenuOption };
