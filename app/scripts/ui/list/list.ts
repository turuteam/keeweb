import { FunctionComponent, h } from 'preact';
import { ListView } from 'views/list/list-view';
import { Workspace } from 'models/workspace';
import { useEffect, useState } from 'preact/hooks';
import { useKey, useModelField } from 'util/ui/hooks';
import { Keys } from 'const/keys';
import { nextItem, prevItem } from 'util/fn';

export const List: FunctionComponent = () => {
    const [, setState] = useState({});
    useEffect(() => {
        const refresh = () => setState({});
        Workspace.query.on('results-updated', refresh);
        return () => Workspace.query.off('results-updated', refresh);
    }, []);

    useKey(Keys.DOM_VK_UP, (e) => {
        e.preventDefault();
        const activeItemId = Workspace.activeItemId;
        const groups = Workspace.query.groups;
        const entries = Workspace.query.entries;

        const prevGroup = prevItem(groups, (g) => g.id === activeItemId);
        if (prevGroup) {
            Workspace.activeItemId = prevGroup.id;
        } else if (prevGroup === undefined) {
            const prevEntry = prevItem(entries, (e) => e.id === activeItemId);
            if (prevEntry) {
                Workspace.activeItemId = prevEntry.id;
            } else if (prevEntry === null && groups.length) {
                Workspace.activeItemId = groups[groups.length - 1].id;
            }
        }
    });
    useKey(Keys.DOM_VK_DOWN, (e) => {
        e.preventDefault();
        const activeItemId = Workspace.activeItemId;
        const groups = Workspace.query.groups;
        const entries = Workspace.query.entries;

        const nextEntry = nextItem(entries, (e) => e.id === activeItemId);
        if (nextEntry) {
            Workspace.activeItemId = nextEntry.id;
        } else if (nextEntry === undefined) {
            const nextGroup = nextItem(groups, (g) => g.id === activeItemId);
            if (nextGroup) {
                Workspace.activeItemId = nextGroup.id;
            } else if (nextGroup === null && entries.length) {
                Workspace.activeItemId = entries[0].id;
            }
        }
    });

    const activeItemId = useModelField(Workspace, 'activeItemId');

    const groups = Workspace.query.groups;
    const entries = Workspace.query.entries;

    const itemsCount = groups.length + entries.length;

    return h(ListView, {
        itemsCount,
        groups,
        entries,
        activeItemId
    });
};
