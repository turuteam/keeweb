import { Events } from 'framework/events';
import { View } from 'framework/views/view';
import { KeyHandler } from 'comp/browser/key-handler';
import { Keys } from 'const/keys';
import { Resizable } from 'framework/views/resizable';

class MenuView extends View {
    constructor(model, options) {
        super(model, options);
        this.listenTo(this, 'view-resize', this.viewResized);
        this.onKey(
            Keys.DOM_VK_UP,
            this.selectPreviousSection,
            KeyHandler.SHORTCUT_ACTION + KeyHandler.SHORTCUT_OPT
        );
        this.onKey(
            Keys.DOM_VK_DOWN,
            this.selectNextSection,
            KeyHandler.SHORTCUT_ACTION + KeyHandler.SHORTCUT_OPT
        );
    }

    selectPreviousSection() {
        Events.emit('select-previous-menu-item');
    }

    selectNextSection() {
        Events.emit('select-next-menu-item');
    }
}

Object.assign(MenuView.prototype, Resizable);

export { MenuView };
