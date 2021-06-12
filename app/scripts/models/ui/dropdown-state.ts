import { Model } from 'util/model';

type DropdownType = 'menu' | 'generator';

class DropdownState extends Model {
    type?: DropdownType;
    id?: string;
    private _resetTimeout?: number;

    listen() {
        document.addEventListener('click', () => this.bodyClicked());
        document.addEventListener('mouseup', () => this.bodyClicked(true));
        document.addEventListener('contextmenu', () => this.bodyClicked());
    }

    set(type: DropdownType, id?: string) {
        if (this._resetTimeout) {
            clearTimeout(this._resetTimeout);
            this._resetTimeout = undefined;
        }
        this.batchSet(() => {
            this.type = type;
            this.id = id;
        });
    }

    reset() {
        super.reset();
    }

    private bodyClicked(defer?: boolean) {
        if (defer) {
            this._resetTimeout = setTimeout(() => {
                this.reset();
            });
        } else {
            this.reset();
        }
    }
}

const instance = new DropdownState();
instance.listen();

export { instance as DropdownState };
