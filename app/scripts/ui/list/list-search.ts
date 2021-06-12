import { FunctionComponent, h } from 'preact';
import { ListSearchView } from 'views/list/list-search-view';
import { useKey, useModelField } from 'util/ui/hooks';
import { Workspace } from 'models/workspace';
import { Position, PropertiesOfType } from 'util/types';
import { AdvancedFilter } from 'models/filter';
import { FileManager } from 'models/file-manager';
import { ContextMenuNew } from 'comp/context-menu/context-menu-new';
import { ContextMenuSort } from 'comp/context-menu/context-menu-sort';
import { ContextMenu } from 'models/context-menu';
import { Keys } from 'const/keys';
import { KeyHandler } from 'comp/browser/key-handler';

export const ListSearch: FunctionComponent = () => {
    const adv = useModelField(Workspace.query.filter, 'advanced');

    useKey(
        Keys.DOM_VK_N,
        () => {
            ContextMenu.hide();
            ContextMenuNew.newEntryClicked();
        },
        KeyHandler.SHORTCUT_OPT
    );

    const toggleAdvClicked = () => {
        Workspace.query.filter.advanced = adv ? undefined : Workspace.lastAdvancedFilter;
    };

    const advChecked = (field: PropertiesOfType<AdvancedFilter, boolean | undefined>) => {
        if (!adv) {
            return;
        }
        Workspace.query.filter.advanced = {
            ...adv,
            [field]: !adv[field]
        };
    };

    const searchChanged = (text: string) => {
        Workspace.query.filter.text = text;
    };

    const clearClicked = () => {
        Workspace.query.filter.text = undefined;
    };

    const newClicked = (shift: boolean, pos: Position) => {
        if (shift) {
            ContextMenuNew.newEntryClicked();
            ContextMenu.hide();
        } else {
            ContextMenuNew.show(pos);
        }
    };

    const sortClicked = (pos: Position) => ContextMenuSort.show(pos);

    return h(ListSearchView, {
        canCreate: FileManager.hasWritableFiles(),
        showAdvanced: !!adv,
        searchText: Workspace.query.filter.text ?? '',
        adv,

        toggleAdvClicked,
        advChecked,
        searchChanged,
        clearClicked,
        newClicked,
        sortClicked
    });
};
