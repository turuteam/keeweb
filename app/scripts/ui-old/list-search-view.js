import { View } from 'framework/views/view';
import { Events } from 'framework/events';
import { Shortcuts } from 'comp/app/shortcuts';
import { KeyHandler } from 'comp/browser/key-handler';
import { Keys } from 'const/keys';
import { Comparators } from 'util/data/comparators';
import { Features } from 'util/features';
import { StringFormat } from 'util/formatting/string-format';
import { Locale } from 'util/locale';
import { DropdownView } from 'views/dropdown-view';
import template from 'templates/list-search.hbs';

class ListSearchView extends View {
    parent = '.list__header';

    template = template;

    events = {
        'keydown .list__search-field': 'inputKeyDown',
        'input .list__search-field': 'inputChange',
        'focus .list__search-field': 'inputFocus',
        'click .list__search-btn-new': 'createOptionsClick',
        'click .list__search-btn-sort': 'sortOptionsClick',
        'click .list__search-icon-search': 'advancedSearchClick',
        'click .list__search-btn-menu': 'toggleMenu',
        'click .list__search-icon-clear': 'clickClear',
        'change .list__search-adv input[type=checkbox]': 'toggleAdvCheck'
    };

    inputEl = null;
    sortOptions = null;
    sortIcons = null;
    createOptions = null;
    advancedSearchEnabled = false;
    advancedSearch = null;

    constructor(model) {
        super(model);
        this.sortOptions = [
            {
                value: 'title',
                icon: 'sort-alpha-down',
                loc: () =>
                    StringFormat.capFirst(Locale.title) + ' ' + this.addArrow(Locale.searchAZ)
            },
            {
                value: '-title',
                icon: 'sort-alpha-down-alt',
                loc: () =>
                    StringFormat.capFirst(Locale.title) + ' ' + this.addArrow(Locale.searchZA)
            },
            {
                value: 'website',
                icon: 'sort-alpha-down',
                loc: () =>
                    StringFormat.capFirst(Locale.website) + ' ' + this.addArrow(Locale.searchAZ)
            },
            {
                value: '-website',
                icon: 'sort-alpha-down-alt',
                loc: () =>
                    StringFormat.capFirst(Locale.website) + ' ' + this.addArrow(Locale.searchZA)
            },
            {
                value: 'user',
                icon: 'sort-alpha-down',
                loc: () => StringFormat.capFirst(Locale.user) + ' ' + this.addArrow(Locale.searchAZ)
            },
            {
                value: '-user',
                icon: 'sort-alpha-down-alt',
                loc: () => StringFormat.capFirst(Locale.user) + ' ' + this.addArrow(Locale.searchZA)
            },
            {
                value: 'created',
                icon: 'sort-numeric-down',
                loc: () => Locale.searchCreated + ' ' + this.addArrow(Locale.searchON)
            },
            {
                value: '-created',
                icon: 'sort-numeric-down-alt',
                loc: () => Locale.searchCreated + ' ' + this.addArrow(Locale.searchNO)
            },
            {
                value: 'updated',
                icon: 'sort-numeric-down',
                loc: () => Locale.searchUpdated + ' ' + this.addArrow(Locale.searchON)
            },
            {
                value: '-updated',
                icon: 'sort-numeric-down-alt',
                loc: () => Locale.searchUpdated + ' ' + this.addArrow(Locale.searchNO)
            },
            {
                value: '-attachments',
                icon: 'sort-amount-down',
                loc: () => Locale.searchAttachments
            },
            { value: '-rank', icon: 'sort-amount-down', loc: () => Locale.searchRank }
        ];
        this.sortIcons = {};
        this.sortOptions.forEach((opt) => {
            this.sortIcons[opt.value] = opt.icon;
        });
        this.setLocale();
        this.onKey(Keys.DOM_VK_N, this.newKeyPress, KeyHandler.SHORTCUT_OPT);
    }

    setLocale() {
        this.sortOptions.forEach((opt) => {
            opt.text = opt.loc();
        });
        this.createOptions = [
            {
                value: 'entry',
                icon: 'key',
                text: StringFormat.capFirst(Locale.entry),
                hint: Features.isMobile
                    ? null
                    : `(${Locale.searchShiftClickOr} ${Shortcuts.altShortcutSymbol(true)})`
            },
            { value: 'group', icon: 'folder', text: StringFormat.capFirst(Locale.group) }
        ];
        if (this.el) {
            this.render();
        }
    }

    newKeyPress(e) {
        if (!this.hidden) {
            e.preventDefault();
            this.hideSearchOptions();
            this.emit('create-entry');
        }
    }

    createOptionsClick(e) {
        e.stopImmediatePropagation();
        if (e.shiftKey) {
            this.hideSearchOptions();
            this.emit('create-entry');
            return;
        }
        this.toggleCreateOptions();
    }

    sortOptionsClick(e) {
        this.toggleSortOptions();
        e.stopImmediatePropagation();
    }

    hideSearchOptions() {
        if (this.views.searchDropdown) {
            this.views.searchDropdown.remove();
            this.views.searchDropdown = null;
            this.$el
                .find('.list__search-btn-sort,.list__search-btn-new')
                .removeClass('sel--active');
        }
    }

    toggleSortOptions() {
        if (this.views.searchDropdown && this.views.searchDropdown.isSort) {
            this.hideSearchOptions();
            return;
        }
        this.hideSearchOptions();
        this.$el.find('.list__search-btn-sort').addClass('sel--active');
        const view = new DropdownView();
        view.isSort = true;
        this.listenTo(view, 'cancel', this.hideSearchOptions);
        this.listenTo(view, 'select', this.sortDropdownSelect);
        this.sortOptions.forEach(function (opt) {
            opt.active = this.model.sort === opt.value;
        }, this);
        view.render({
            position: {
                top: this.$el.find('.list__search-btn-sort')[0].getBoundingClientRect().bottom,
                right: this.$el[0].getBoundingClientRect().right + 1
            },
            options: this.sortOptions
        });
        this.views.searchDropdown = view;
    }

    toggleCreateOptions() {
        if (this.views.searchDropdown && this.views.searchDropdown.isCreate) {
            this.hideSearchOptions();
            return;
        }

        this.hideSearchOptions();
        this.$el.find('.list__search-btn-new').addClass('sel--active');
        const view = new DropdownView();
        view.isCreate = true;
        this.listenTo(view, 'cancel', this.hideSearchOptions);
        this.listenTo(view, 'select', this.createDropdownSelect);
        view.render({
            position: {
                top: this.$el.find('.list__search-btn-new')[0].getBoundingClientRect().bottom,
                right: this.$el[0].getBoundingClientRect().right + 1
            },
            options: this.createOptions.concat(this.getCreateEntryTemplateOptions())
        });
        this.views.searchDropdown = view;
    }

    getCreateEntryTemplateOptions() {
        const entryTemplates = this.model.getEntryTemplates();
        const hasMultipleFiles = this.model.files.length > 1;
        this.entryTemplates = {};
        const options = [];
        entryTemplates.forEach((tmpl) => {
            const id = 'tmpl:' + tmpl.entry.id;
            options.push({
                value: id,
                icon: tmpl.entry.icon,
                text: hasMultipleFiles
                    ? tmpl.file.name + ' / ' + tmpl.entry.title
                    : tmpl.entry.title
            });
            this.entryTemplates[id] = tmpl;
        });
        options.sort(Comparators.stringComparator('text', true));
        options.push({
            value: 'tmpl',
            icon: 'sticky-note-o',
            text: StringFormat.capFirst(Locale.template)
        });
        return options;
    }

    sortDropdownSelect(e) {
        this.hideSearchOptions();
        Events.emit('set-sort', e.item);
    }

    createDropdownSelect(e) {
        this.hideSearchOptions();
        switch (e.item) {
            case 'entry':
                this.emit('create-entry');
                break;
            case 'group':
                this.emit('create-group');
                break;
            case 'tmpl':
                this.emit('create-template');
                break;
            default:
                if (this.entryTemplates[e.item]) {
                    this.emit('create-entry', { template: this.entryTemplates[e.item] });
                }
        }
    }

    addArrow(str) {
        return str.replace('{}', '→');
    }
}

export { ListSearchView };
