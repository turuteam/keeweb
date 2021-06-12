import { Model } from 'util/model';
import { Callback, Position } from 'util/types';
import { nextItem, prevItem } from 'util/fn';
import { Timeouts } from 'const/timeouts';

export class ContextMenuItem extends Model {
    id: string;
    icon: string;
    title: string;
    hint?: string;
    callback: Callback;

    constructor(id: string, icon: string, title: string, callback: Callback) {
        super();
        this.id = id;
        this.icon = icon;
        this.title = title;
        this.callback = callback;
    }
}

class ContextMenu extends Model {
    id = '';
    justHiddenMenuId = '';
    pos: Position = {};
    items: ContextMenuItem[] = [];
    selectedItem?: ContextMenuItem;
    private _cleanupTimeout?: number;

    hide(): void {
        this.batchSet(() => {
            const id = this.id;
            this.reset();
            this.justHiddenMenuId = id;

            if (id) {
                this._cleanupTimeout = window.setTimeout(
                    () => (this.justHiddenMenuId = ''),
                    Timeouts.ContextMenuCleanup
                );
            }
        });
    }

    toggle(
        id: string,
        pos: Position,
        items: ContextMenuItem[],
        selectedItem?: ContextMenuItem
    ): void {
        this.batchSet(() => {
            const wasVisible = this.id === id || this.justHiddenMenuId === id;
            this.reset();
            if (!wasVisible) {
                this.pos = pos;
                this.items = items;
                this.selectedItem = selectedItem;
                this.id = id;
            }
        });
        if (this._cleanupTimeout) {
            clearTimeout(this._cleanupTimeout);
        }
    }

    selectNext(): void {
        this.selectedItem = nextItem(this.items, (it) => it === this.selectedItem) ?? this.items[0];
    }

    selectPrevious(): void {
        this.selectedItem =
            prevItem(this.items, (it) => it === this.selectedItem) ??
            this.items[this.items.length - 1];
    }

    closeWithSelectedResult(): void {
        if (this.selectedItem) {
            this.closeWithResult(this.selectedItem);
        } else {
            this.hide();
        }
    }

    closeWithResult(item: ContextMenuItem): void {
        item.callback();
        this.hide();
    }
}

const instance = new ContextMenu();

export { instance as ContextMenu };
