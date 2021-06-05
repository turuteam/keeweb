import { FunctionComponent, h } from 'preact';
import { memo } from 'preact/compat';
import { ListItemShortView } from 'views/list/list-item-short-view';
import { Entry } from 'models/entry';
import { Workspace } from 'models/workspace';
import { QuerySort } from 'models/query';
import { DateFormat } from 'util/formatting/date-format';
import { Locale } from 'util/locale';
import { AppSettings } from 'models/app-settings';

const DefaultIcon = 'key';

export const ListEntryShort: FunctionComponent<{ entry: Entry; active: boolean }> = memo(
    ({ entry, active }) => {
        const sort = Workspace.query.sort;

        const itemClicked = () => {
            Workspace.activeItemId = entry.id;
        };

        let color = entry.color ?? '';
        if (!color && entry.customIcon && !AppSettings.colorfulIcons) {
            color = 'grayscale';
        }

        return h(ListItemShortView, {
            id: entry.id,
            title: entry.title,
            description: getDescription(entry, sort),
            active,
            expired: entry.expired,
            icon: entry.icon ?? entry.customIcon ?? DefaultIcon,
            isCustomIcon: !!entry.customIcon,
            color,

            itemClicked
        });
    }
);

function getDescription(entry: Entry, sort: QuerySort): string {
    switch (sort) {
        case QuerySort.WebsiteAsc:
        case QuerySort.WebsiteDesc:
            return entry.url ?? '';
        case QuerySort.UserAsc:
        case QuerySort.UserDesc:
            return entry.user ?? '';
        case QuerySort.CreatedAsc:
        case QuerySort.CreatedDesc:
            return entry.created ? DateFormat.dtStr(entry.created) : '';
        case QuerySort.UpdatedAsc:
        case QuerySort.UpdatedDesc:
            return entry.created ? DateFormat.dtStr(entry.created) : '';
        case QuerySort.AttachmentsDesc:
            return entry.attachments?.length
                ? entry.attachments.map((a) => a.title).join(', ')
                : `(${Locale.listNoAttachments})`;
        case QuerySort.TitleAsc:
        case QuerySort.TitleDesc:
        case QuerySort.RankDesc:
            return defaultDescription(entry);
    }
}

function defaultDescription(entry: Entry): string {
    return entry.user || entry.notes || entry.url || '';
}
