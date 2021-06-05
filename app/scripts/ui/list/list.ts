import { FunctionComponent, h } from 'preact';
import { ListView } from 'views/list/list-view';
import { Workspace } from 'models/workspace';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { useKey, useModelField } from 'util/ui/hooks';
import { Keys } from 'const/keys';
import { nextItem, prevItem } from 'util/fn';
import { AppSettings } from 'models/app-settings';

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

    const [scrollTop, setScrollTop] = useState(0);

    const itemHeight = useMemo(() => {
        return 47.59375; // TODO: calculate item height
    }, [AppSettings.tableView]);
    const visibleItemsCount = Math.ceil(window.innerHeight / itemHeight);
    const scrollBufferSizeInItems = Math.max(4, Math.ceil(visibleItemsCount / 2));
    const firstVisibleItem = Math.floor(scrollTop / itemHeight);
    const lastVisibleItem = firstVisibleItem + visibleItemsCount;
    const firstItem = Math.max(0, firstVisibleItem - scrollBufferSizeInItems);
    const lastItem = Math.min(itemsCount, lastVisibleItem + scrollBufferSizeInItems);

    const firstGroup = firstItem < groups.length ? firstItem : -1;
    const lastGroup = lastItem < groups.length ? lastItem : groups.length - 1;
    const firstEntry = lastItem < groups.length ? -1 : Math.max(0, firstItem - groups.length);
    const lastEntry = lastItem - groups.length;

    const firstItemOffset = firstItem * itemHeight;
    const totalHeight = itemsCount * itemHeight;

    const onScroll = (e: Event) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        setScrollTop(target.scrollTop);
    };

    return h(ListView, {
        itemsCount,
        groups: firstGroup < 0 ? [] : groups.slice(firstGroup, lastGroup + 1),
        entries: firstEntry < 0 ? [] : entries.slice(firstEntry, lastEntry + 1),
        activeItemId,
        firstItemOffset,
        totalHeight,

        onScroll
    });
};
