import { Events } from 'framework/events';
import { View } from 'framework/views/view';
import { DragDropInfo } from 'comp/app/drag-drop-info';

class MenuItemView extends View {
    editItem(e) {
        if (this.model.active && this.model.editable) {
            e.stopPropagation();
            switch (this.model.filterKey) {
                case 'tag':
                    Events.emit('edit-tag', this.model);
                    break;
                case 'group':
                    Events.emit('edit-group', this.model);
                    break;
            }
        }
    }

    dropAllowed(e) {
        const types = e.dataTransfer.types;
        for (let i = 0; i < types.length; i++) {
            if (types[i] === 'text/group' || types[i] === 'text/entry') {
                return DragDropInfo.dragObject && !DragDropInfo.dragObject.readOnly;
            }
        }
        return false;
    }

    dragstart(e) {
        e.stopPropagation();
        if (this.model.drag) {
            e.dataTransfer.setData('text/group', this.model.id);
            e.dataTransfer.effectAllowed = 'move';
            DragDropInfo.dragObject = this.model;
        }
    }

    dragover(e) {
        if (this.model.drop && this.dropAllowed(e)) {
            e.stopPropagation();
            e.preventDefault();
            this.$el.addClass('menu__item--drag');
        }
    }

    dragleave(e) {
        e.stopPropagation();
        if (this.model.drop && this.dropAllowed(e)) {
            this.$el.removeClass('menu__item--drag menu__item--drag-top');
        }
    }

    drop(e) {
        e.stopPropagation();
        if (this.model.drop && this.dropAllowed(e)) {
            const isTop = this.$el.hasClass('menu__item--drag-top');
            this.$el.removeClass('menu__item--drag menu__item--drag-top');
            if (isTop) {
                this.model.moveToTop(DragDropInfo.dragObject);
            } else {
                if (this.model.filterKey === 'trash') {
                    DragDropInfo.dragObject.moveToTrash();
                } else {
                    this.model.moveHere(DragDropInfo.dragObject);
                }
            }
            Events.emit('refresh');
        }
    }

    dropTopAllowed(e) {
        const types = e.dataTransfer.types;
        for (let i = 0; i < types.length; i++) {
            if (types[i] === 'text/group') {
                return true;
            }
        }
        return false;
    }

    dragoverTop(e) {
        if (this.dropTopAllowed(e)) {
            this.$el.addClass('menu__item--drag-top');
        }
    }

    dragleaveTop(e) {
        if (this.dropTopAllowed(e)) {
            this.$el.removeClass('menu__item--drag-top');
        }
    }
}

export { MenuItemView };
