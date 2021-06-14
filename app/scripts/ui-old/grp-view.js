import { View } from 'framework/views/view';
import { AutoTypeHintView } from 'views/auto-type/auto-type-hint-view';
import { IconSelectView } from 'views/icon-select-view';

class GrpView extends View {
    focusAutoTypeSeq(e) {
        if (!this.views.hint) {
            this.views.hint = new AutoTypeHintView({ input: e.target });
            this.views.hint.render();
            this.views.hint.on('remove', () => {
                delete this.views.hint;
            });
        }
    }

    showIconsSelect() {
        if (this.views.sub) {
            this.removeSubView();
        } else {
            const subView = new IconSelectView(
                {
                    iconId: this.model.customIconId || this.model.iconId,
                    file: this.model.file
                },
                {
                    parent: this.$el.find('.grp__icons')[0]
                }
            );
            this.listenTo(subView, 'select', this.iconSelected);
            subView.render();
            this.views.sub = subView;
        }
        this.pageResized();
    }

    iconSelected(sel) {
        if (sel.custom) {
            if (sel.id !== this.model.customIconId) {
                this.model.setCustomIcon(sel.id);
            }
        } else if (sel.id !== this.model.iconId) {
            this.model.setIcon(+sel.id);
        }
        this.render();
    }
}
