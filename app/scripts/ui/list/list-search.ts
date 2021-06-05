import { FunctionComponent, h } from 'preact';
import { ListSearchView } from 'views/list/list-search-view';
import { useModelField } from 'util/ui/hooks';
import { Workspace } from 'models/workspace';
import { PropertiesOfType } from 'util/types';
import { AdvancedFilter } from 'models/filter';
import { FileManager } from 'models/file-manager';

export const ListSearch: FunctionComponent = () => {
    const adv = useModelField(Workspace.query.filter, 'advanced');

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

    return h(ListSearchView, {
        canCreate: FileManager.hasWritableFiles(),
        showAdvanced: !!adv,
        searchText: Workspace.query.filter.text ?? '',
        adv,

        toggleAdvClicked,
        advChecked,
        searchChanged,
        clearClicked
    });
};
