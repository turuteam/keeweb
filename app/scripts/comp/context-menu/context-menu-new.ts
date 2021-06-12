import { ContextMenu, ContextMenuItem } from 'models/menu/context-menu';
import { StringFormat } from 'util/formatting/string-format';
import { Locale } from 'util/locale';
import { Features } from 'util/features';
import { Shortcuts } from 'comp/browser/shortcuts';
import { Position } from 'util/types';
import { FileManager } from 'models/file-manager';
import { Entry } from 'models/entry';
import { File } from 'models/file';

export class ContextMenuNew {
    static show(pos: Position): void {
        const newEntryMenuItem = new ContextMenuItem(
            'entry',
            'key',
            StringFormat.capFirst(Locale.entry),
            () => this.newEntryClicked()
        );
        if (!Features.isMobile) {
            const shortcut = Shortcuts.presentShortcut('Alt+N');
            newEntryMenuItem.hint = `(${Locale.searchShiftClickOr} ${shortcut})`;
        }

        const newGroupMenuItem = new ContextMenuItem(
            'group',
            'folder',
            StringFormat.capFirst(Locale.group),
            () => this.newGroupClicked()
        );

        const templateMenuItems: ContextMenuItem[] = [];
        const hasMultipleFiles = FileManager.files.length > 1;
        for (const file of FileManager.files) {
            for (const entry of file.allEntryTemplates()) {
                if (!entry.title) {
                    continue;
                }
                const id = `tmpl:${entry.id}`;
                templateMenuItems.push(
                    new ContextMenuItem(
                        id,
                        entry.icon ?? 'sticky-note-o',
                        hasMultipleFiles ? `${file.name} / ${entry.title}` : entry.title,
                        () => this.newFromTemplateClicked(entry, file)
                    )
                );
            }
        }
        const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
        templateMenuItems.sort((x, y) => {
            return collator.compare(x.title, y.title);
        });
        templateMenuItems.push(
            new ContextMenuItem(
                'tmpl',
                'sticky-note-o',
                StringFormat.capFirst(Locale.template),
                () => this.newTemplateClicked()
            )
        );

        ContextMenu.toggle('new', pos, [newEntryMenuItem, newGroupMenuItem, ...templateMenuItems]);
    }

    static newEntryClicked(): void {
        // TODO
    }

    static newGroupClicked(): void {
        // TODO
    }

    static newTemplateClicked(): void {
        // TODO
    }

    static newFromTemplateClicked(entry: Entry, file: File): void {
        // TODO
    }
}
