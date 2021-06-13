import { FunctionComponent, h } from 'preact';
import { TagPanelView } from 'views/panel/tag-panel-view';
import { Workspace } from 'models/workspace';
import { useState } from 'preact/hooks';
import { Alerts } from 'comp/ui/alerts';
import { Locale } from 'util/locale';

export const TagPanel: FunctionComponent = () => {
    let selectedMenuItemTag = '';
    if (Workspace.menu.selectedItem.filter?.type === 'tag') {
        selectedMenuItemTag = Workspace.menu.selectedItem.filter.value;
    }

    const [title, setTitle] = useState(selectedMenuItemTag);

    const backClicked = () => Workspace.showList();

    const titleChanged = (value: string) => setTitle(value);

    const renameClicked = () => {
        const newTag = title.trim();
        if (!newTag || selectedMenuItemTag === newTag) {
            return;
        }
        if (/[;,:]/.test(newTag)) {
            Alerts.error({
                header: Locale.tagBadName,
                body: Locale.tagBadNameBody.with('`,`, `;`, `:`')
            });
            return;
        }
        if (Workspace.tags.some((t) => t.toLowerCase() === title.toLowerCase())) {
            Alerts.error({ header: Locale.tagExists, body: Locale.tagExistsBody });
            return;
        }
        Workspace.renameTag(selectedMenuItemTag, newTag);
        Workspace.selectAllAndShowList();
    };

    const trashClicked = () => {
        Alerts.yesno({
            header: Locale.tagTrashQuestion,
            body: Locale.tagTrashQuestionBody,
            success: () => {
                Workspace.renameTag(selectedMenuItemTag, '');
                Workspace.selectAllAndShowList();
            }
        });
    };

    if (!selectedMenuItemTag) {
        return null;
    }

    return h(TagPanelView, {
        title,

        backClicked,
        titleChanged,
        renameClicked,
        trashClicked
    });
};
