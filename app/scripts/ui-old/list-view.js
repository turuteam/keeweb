import { View } from 'framework/views/view';
import { Events } from 'framework/events';
import { DragDropInfo } from 'comp/app/drag-drop-info';
import { Alerts } from 'comp/ui/alerts';
import { AppSettingsModel } from 'models/app-settings-model';
import { StringFormat } from 'util/formatting/string-format';
import { Locale } from 'util/locale';
import { DropdownView } from 'views/dropdown-view';

class ListView extends View {
    tableColumns = [
        { val: 'title', name: 'title', enabled: true },
        { val: 'user', name: 'user', enabled: true },
        { val: 'url', name: 'website', enabled: true },
        { val: 'tags', name: 'tags', enabled: true },
        { val: 'notes', name: 'notes', enabled: true },
        { val: 'groupName', name: 'group', enabled: false },
        { val: 'fileName', name: 'file', enabled: false }
    ];

    createEntry(arg) {
        const newEntry = this.model.createNewEntry(arg);
        this.items.unshift(newEntry);
        this.render();
        this.selectItem(newEntry);
        Events.emit('toggle-details', true);
    }

    createGroup() {
        const newGroup = this.model.createNewGroup();
        Events.emit('edit-group', newGroup);
    }

    createTemplate() {
        if (!this.model.settings.templateHelpShown) {
            Alerts.yesno({
                icon: 'sticky-note-o',
                header: Locale.listAddTemplateHeader,
                body:
                    Locale.listAddTemplateBody1.replace('{}', '"+"') +
                    '\n' +
                    Locale.listAddTemplateBody2.replace('{}', 'Templates'),
                buttons: [Alerts.buttons.ok, Alerts.buttons.cancel],
                success: () => {
                    this.model.settings.templateHelpShown = true;
                    this.createTemplate();
                }
            });
            return;
        }
        const templateEntry = this.model.createNewTemplateEntry();
        this.items.unshift(templateEntry);
        this.render();
        this.selectItem(templateEntry);
    }

    setTableView() {
        const isTable = this.model.settings.tableView;
        this.dragView.setCoord(isTable ? 'y' : 'x');
        this.setDefaultSize();
    }

    entryUpdated() {
        const scrollTop = this.itemsEl[0].scrollTop;
        this.render();
        this.itemsEl[0].scrollTop = scrollTop;
        this.renderVisibleItems();
    }

    itemDragStart(e) {
        e.stopPropagation();
        const id = $(e.target).closest('.list__item').attr('id');
        e.dataTransfer.setData('text/entry', id);
        e.dataTransfer.effectAllowed = 'move';
        DragDropInfo.dragObject = this.items.get(id);
    }

    tableOptionsClick(e) {
        e.stopImmediatePropagation();
        if (this.views.optionsDropdown) {
            this.hideOptionsDropdown();
            return;
        }
        const view = new DropdownView();
        this.listenTo(view, 'cancel', this.hideOptionsDropdown);
        this.listenTo(view, 'select', this.optionsDropdownSelect);
        const targetElRect = this.$el.find('.list__table-options')[0].getBoundingClientRect();
        const options = this.tableColumns.map((col) => ({
            value: col.val,
            icon: col.enabled ? 'check-square-o' : 'square-o',
            text: StringFormat.capFirst(Locale[col.name])
        }));
        view.render({
            position: {
                top: targetElRect.bottom,
                left: targetElRect.left
            },
            options
        });
        this.views.optionsDropdown = view;
    }

    hideOptionsDropdown() {
        if (this.views.optionsDropdown) {
            this.views.optionsDropdown.remove();
            delete this.views.optionsDropdown;
        }
    }

    optionsDropdownSelect(e) {
        const col = this.tableColumns.find((c) => c.val === e.item);
        col.enabled = !col.enabled;
        e.el.find('i:first').toggleClass('fa-check-square-o fa-square-o');
        this.render();
        this.saveTableColumnsEnabled();
    }

    readTableColumnsEnabled() {
        const tableViewColumns = AppSettingsModel.tableViewColumns;
        if (tableViewColumns && tableViewColumns.length) {
            this.tableColumns.forEach((col) => {
                col.enabled = tableViewColumns.indexOf(col.name) >= 0;
            });
        }
    }

    saveTableColumnsEnabled() {
        const tableViewColumns = this.tableColumns
            .filter((column) => column.enabled)
            .map((column) => column.name);
        AppSettingsModel.tableViewColumns = tableViewColumns;
    }
}

export { ListView };
