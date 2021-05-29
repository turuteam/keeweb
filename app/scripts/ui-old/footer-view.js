import { View } from 'framework/views/view';
import { Events } from 'framework/events';
import { KeyHandler } from 'comp/browser/key-handler';
import { Keys } from 'const/keys';
import { UpdateModel } from 'models/update-model';
import { GeneratorView } from 'views/generator-view';

class FooterView extends View {
    constructor(model, options) {
        super(model, options);

        this.onKey(Keys.DOM_VK_G, this.genPass, KeyHandler.SHORTCUT_ACTION);
        this.onKey(Keys.DOM_VK_S, this.saveAll, KeyHandler.SHORTCUT_ACTION);

        this.listenTo(this, 'hide', this.viewHidden);
        this.listenTo(this.model.files, 'change', this.render);
        this.listenTo(Events, 'file-changed', this.render);
        this.listenTo(Events, 'set-locale', this.render);
        this.listenTo(UpdateModel, 'change:updateStatus', this.render);
    }

    viewHidden() {
        if (this.views.gen) {
            this.views.gen.remove();
            delete this.views.gen;
        }
    }

    genPass(e) {
        e.stopPropagation();
        if (this.views.gen) {
            this.views.gen.remove();
            return;
        }
        const el = this.$el.find('.footer__btn-generate');
        const rect = el[0].getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        const right = bodyRect.right - rect.right;
        const bottom = bodyRect.bottom - rect.top;
        const generator = new GeneratorView({ copy: true, pos: { right, bottom } });
        generator.render();
        generator.once('remove', () => {
            delete this.views.gen;
        });
        this.views.gen = generator;
    }

    showFile(e) {
        const fileId = $(e.target).closest('.footer__db-item').data('file-id');
        if (fileId) {
            Events.emit('show-file', { fileId });
        }
    }

    saveAll() {
        Events.emit('save-all');
    }

    toggleHelp() {
        Events.emit('toggle-settings', 'help');
    }
}

export { FooterView };
