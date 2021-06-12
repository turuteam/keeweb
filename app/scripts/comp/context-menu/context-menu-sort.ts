import { ContextMenu, ContextMenuItem } from 'models/context-menu';
import { Position } from 'util/types';
import { StringFormat } from 'util/formatting/string-format';
import { Locale } from 'util/locale';
import { QuerySort } from 'models/query';
import { Workspace } from 'models/workspace';

const arrow = '→';

export class ContextMenuSort {
    static show(pos: Position): void {
        const items: ContextMenuItem[] = [
            new ContextMenuItem(
                QuerySort.TitleAsc,
                'sort-alpha-down',
                StringFormat.capFirst(Locale.title) + ' ' + Locale.searchAZ.with(arrow),
                () => this.itemClicked(QuerySort.TitleAsc)
            ),
            new ContextMenuItem(
                QuerySort.TitleDesc,
                'sort-alpha-down-alt',
                StringFormat.capFirst(Locale.title) + ' ' + Locale.searchZA.with(arrow),
                () => this.itemClicked(QuerySort.TitleDesc)
            ),
            new ContextMenuItem(
                QuerySort.WebsiteAsc,
                'sort-alpha-down',
                StringFormat.capFirst(Locale.website) + ' ' + Locale.searchAZ.with(arrow),
                () => this.itemClicked(QuerySort.WebsiteAsc)
            ),
            new ContextMenuItem(
                QuerySort.WebsiteDesc,
                'sort-alpha-down-alt',
                StringFormat.capFirst(Locale.website) + ' ' + Locale.searchZA.with(arrow),
                () => this.itemClicked(QuerySort.WebsiteDesc)
            ),
            new ContextMenuItem(
                QuerySort.UserAsc,
                'sort-alpha-down',
                StringFormat.capFirst(Locale.user) + ' ' + Locale.searchAZ.with(arrow),
                () => this.itemClicked(QuerySort.UserAsc)
            ),
            new ContextMenuItem(
                QuerySort.UserDesc,
                'sort-alpha-down-alt',
                StringFormat.capFirst(Locale.user) + ' ' + Locale.searchZA.with(arrow),
                () => this.itemClicked(QuerySort.UserDesc)
            ),
            new ContextMenuItem(
                QuerySort.CreatedAsc,
                'sort-numeric-down',
                StringFormat.capFirst(Locale.searchCreated) + ' ' + Locale.searchON.with(arrow),
                () => this.itemClicked(QuerySort.CreatedAsc)
            ),
            new ContextMenuItem(
                QuerySort.CreatedDesc,
                'sort-numeric-down-alt',
                StringFormat.capFirst(Locale.searchCreated) + ' ' + Locale.searchNO.with(arrow),
                () => this.itemClicked(QuerySort.CreatedDesc)
            ),
            new ContextMenuItem(
                QuerySort.UpdatedAsc,
                'sort-numeric-down',
                StringFormat.capFirst(Locale.searchUpdated) + ' ' + Locale.searchON.with(arrow),
                () => this.itemClicked(QuerySort.UpdatedAsc)
            ),
            new ContextMenuItem(
                QuerySort.UpdatedDesc,
                'sort-numeric-down-alt',
                StringFormat.capFirst(Locale.searchUpdated) + ' ' + Locale.searchNO.with(arrow),
                () => this.itemClicked(QuerySort.UpdatedDesc)
            ),
            new ContextMenuItem(
                QuerySort.AttachmentsDesc,
                'sort-amount-down',
                Locale.searchAttachments,
                () => this.itemClicked(QuerySort.AttachmentsDesc)
            ),
            new ContextMenuItem(QuerySort.RankDesc, 'sort-amount-down', Locale.searchRank, () =>
                this.itemClicked(QuerySort.RankDesc)
            )
        ];

        const selectedItem = items.find((it) => it.id === Workspace.query.sort);

        ContextMenu.toggle('sort', pos, items, selectedItem);
    }

    private static itemClicked(sort: QuerySort) {
        Workspace.query.sort = sort;
    }
}
