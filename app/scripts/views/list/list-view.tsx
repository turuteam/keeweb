import { FunctionComponent } from 'preact';
import { ListSearch } from 'ui/list/list-search';
import { ListEmpty } from 'ui/list/list-empty';
import { ListEntryShort } from 'ui/list/list-entry-short';
import { Scrollable } from 'views/components/scrollable';
import { Group } from 'models/group';
import { Entry } from 'models/entry';

export const ListView: FunctionComponent<{
    itemsCount: number;
    groups: Group[];
    entries: Entry[];
    activeItemId: string | undefined;
    firstItemOffset: number;
    totalHeight: number;

    onScroll: (e: Event) => void;
}> = ({ itemsCount, entries, activeItemId, firstItemOffset, totalHeight, onScroll }) => {
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
