import { View } from 'framework/views/view';
import { AppSettingsModel } from 'models/app-settings-model';
import { Resizable } from 'framework/views/resizable';
import throttle from 'lodash/throttle';

class MenuSectionView extends View {
    minHeight = 55;
    autoHeight = 'auto';

    render() {
        if (this.model.drag) {
            const height = AppSettingsModel.tagsViewHeight;
            if (typeof height === 'number') {
                this.$el.height();
                this.$el.css('flex', '0 0 ' + height + 'px');
            }
        }
    }

    maxHeight() {
        return this.$el.parent().height() - 116;
    }

    viewResized(size) {
        this.$el.css('flex', '0 0 ' + (size ? size + 'px' : 'auto'));
        this.saveViewHeight(size);
    }

    saveViewHeight = throttle((size) => {
        AppSettingsModel.tagsViewHeight = size;
    }, 1000);
}

Object.assign(MenuSectionView.prototype, Resizable);

export { MenuSectionView };
