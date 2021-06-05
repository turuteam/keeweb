import { FunctionComponent } from 'preact';
import { ListSearch } from 'ui/list/list-search';
import { ListEmpty } from 'ui/list/list-empty';
import { ListEntryShort } from 'ui/list/list-entry-short';
import { Scrollable } from 'views/components/scrollable';
import { Group } from 'models/group';
import { Entry } from 'models/entry';
import { useLayoutEffect } from 'preact/hooks';

export const ListView: FunctionComponent<{
    itemsCount: number;
    groups: Group[];
    entries: Entry[];
    activeItemId: string | undefined;
    firstItemOffset: number;
    totalHeight: number;

    onScroll: (e: Event) => void;
}> = ({ itemsCount, entries, activeItemId, firstItemOffset, totalHeight, onScroll }) => {
    useLayoutEffect(() => {
        if (!activeItemId) {
            return;
        }
        const activeItem = document.getElementById(activeItemId);
        if (!activeItem) {
            return;
        }
        const scroller = activeItem.closest('.scroller');
        if (!scroller) {
            return;
        }
        const itemRect = activeItem.getBoundingClientRect();
        const listRect = scroller.getBoundingClientRect();
        if (itemRect.top < listRect.top) {
            scroller.scrollTop += itemRect.top - listRect.top;
        } else if (itemRect.bottom > listRect.bottom) {
            scroller.scrollTop += itemRect.bottom - listRect.bottom;
        }
    }, [activeItemId]);

    return (
        <div class="list">
            <div class="list__header">
                <ListSearch />
            </div>
            <div class="list__items">
                {itemsCount ? (
                    <Scrollable onScroll={onScroll}>
                        <div
                            class="list__list list__items-container"
                            style={{ height: totalHeight, paddingTop: firstItemOffset }}
                        >
                            {entries.map((entry) => (
                                <ListEntryShort
                                    key={entry.id}
                                    entry={entry}
                                    active={entry.id === activeItemId}
                                />
                            ))}
                        </div>
                    </Scrollable>
                ) : (
                    <ListEmpty />
                )}
            </div>
        </div>
    );
};
