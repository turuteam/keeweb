import { DefaultModelEvents, Model } from 'util/model';
import { Filter } from 'models/filter';
import { Entry } from 'models/entry';
import { AppSettings } from 'models/app-settings';
import { FileManager } from 'models/file-manager';
import { PropertiesOfType } from 'util/types';
import { Group } from 'models/group';

interface QueryEvents extends DefaultModelEvents {
    'results-updated': () => void;
}

export enum QuerySort {
    TitleAsc = 'title',
    TitleDesc = '-title',
    WebsiteAsc = 'website',
    WebsiteDesc = '-website',
    UserAsc = 'user',
    UserDesc = '-user',
    CreatedAsc = 'created',
    CreatedDesc = '-created',
    UpdatedAsc = 'updated',
    UpdatedDesc = '-updated',
    AttachmentsDesc = '-attachments',
    RankDesc = '-rank'
}

type EntryComparator = (lhs: Entry, rhs: Entry) => number;

export class Query extends Model<QueryEvents> {
    readonly filter = new Filter();
    sort: QuerySort = QuerySort.TitleAsc;

    private _entries?: Entry[];
    private _groups?: Group[];
    private _preparingFilter?: boolean;

    constructor() {
        super();
        this.filter.on('change', () => this.filterChanged());
        (this as Query).onChange('sort', () => this.updateResults());
        AppSettings.onChange('expandGroups', () => this.updateResults());
    }

    get entries(): Entry[] {
        if (!this._entries) {
            this.runQuery();
        }
        return this._entries || [];
    }

    get groups(): Group[] {
        if (!this._groups) {
            this.runQuery();
        }
        return this._groups || [];
    }

    reset(): void {
        this.filter.reset();
    }

    updateResults(): void {
        this._entries = undefined;
        this._groups = undefined;
        this.emit('results-updated');
    }

    private filterChanged() {
        if (!this._preparingFilter) {
            this.updateResults();
        }
    }

    private runQuery(): void {
        this.prepareFilter();

        const entries: Entry[] = [];

        const devicesToMatchOtpEntries = FileManager.files.filter(
            (file) => file.backend === 'otp-device'
        );
        const matchedOtpEntrySet = AppSettings.yubiKeyMatchEntries ? new Set() : undefined;

        for (const file of FileManager.files) {
            if (file.backend === 'otp-device') {
                continue;
            }
            for (const entry of file.entriesMatching(this.filter)) {
                // if (matchedOtpEntrySet) { // TODO: OTP devices
                //     for (const device of devicesToMatchOtpEntries) {
                //         const matchingEntry = device.getMatchingEntry(entry);
                //         if (matchingEntry) {
                //             matchedOtpEntrySet.add(matchingEntry);
                //         }
                //     }
                // }
                entries.push(entry);
            }
        }

        if (devicesToMatchOtpEntries.length) {
            for (const device of devicesToMatchOtpEntries) {
                for (const entry of device.entriesMatching(this.filter)) {
                    if (!matchedOtpEntrySet || !matchedOtpEntrySet.has(entry)) {
                        entries.push(entry);
                    }
                }
            }
        }

        entries.sort(this.getComparator());

        const groups: Group[] = [];
        if (this.filter.trash) {
            Query.addTrashGroups(groups);
        }

        this._entries = entries;
        this._groups = groups;
    }

    private static addTrashGroups(groups: Group[]) {
        for (const file of FileManager.files) {
            const trashGroup = file.getTrashGroup?.();
            if (trashGroup) {
                for (const group of trashGroup.items) {
                    groups.push(group); // TODO: make sure this works
                }
            }
        }
    }

    private prepareFilter(): void {
        this._preparingFilter = true;

        const filter = this.filter;

        filter.batchSet(() => {
            filter.subGroups = AppSettings.expandGroups;
            filter.textLower = filter.text ? filter.text.toLowerCase() : '';
            filter.textParts = undefined;
            filter.textLowerParts = undefined;

            const exact = filter.advanced?.exact;
            if (!exact && filter.text) {
                const textParts = filter.text.split(/\s+/).filter((s) => s);
                if (textParts.length) {
                    filter.textParts = textParts;
                    filter.textLowerParts = filter.textLower.split(/\s+/).filter((s) => s);
                }
            }

            filter.tagLower = filter.tag ? filter.tag.toLowerCase() : '';
        });

        this._preparingFilter = false;
    }

    private getComparator(): EntryComparator {
        switch (this.sort) {
            case QuerySort.TitleAsc:
                return Query.stringComparator('title', true);
            case QuerySort.TitleDesc:
                return Query.stringComparator('title', false);
            case QuerySort.WebsiteAsc:
                return Query.stringComparator('url', true);
            case QuerySort.WebsiteDesc:
                return Query.stringComparator('url', false);
            case QuerySort.UserAsc:
                return Query.stringComparator('user', true);
            case QuerySort.UserDesc:
                return Query.stringComparator('user', false);
            case QuerySort.CreatedAsc:
                return Query.dateComparator('created', true);
            case QuerySort.CreatedDesc:
                return Query.dateComparator('created', false);
            case QuerySort.UpdatedAsc:
                return Query.dateComparator('updated', true);
            case QuerySort.UpdatedDesc:
                return Query.dateComparator('updated', false);
            case QuerySort.AttachmentsDesc:
                return Query.attachmentsComparator();
            case QuerySort.RankDesc:
                return Query.rankComparator(this.filter);
        }
    }

    private static stringComparator(
        field: PropertiesOfType<Entry, string | undefined>,
        asc: boolean
    ): EntryComparator {
        const LastChar = String.fromCharCode(0xfffd);
        const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
        if (asc) {
            return (x, y) => {
                return collator.compare(x[field] || LastChar, y[field] || LastChar);
            };
        } else {
            return (x, y) => {
                return collator.compare(y[field] || LastChar, x[field] || LastChar);
            };
        }
    }

    private static dateComparator(
        field: PropertiesOfType<Entry, Date | undefined>,
        asc: boolean
    ): EntryComparator {
        if (asc) {
            return (x, y) => {
                return (x[field]?.getTime() ?? 0) - (y[field]?.getTime() ?? 0);
            };
        } else {
            return (x, y) => {
                return (y[field]?.getTime() ?? 0) - (x[field]?.getTime() ?? 0);
            };
        }
    }

    private static attachmentsComparator(): EntryComparator {
        return (x, y) => {
            return this.attachmentSortVal(x).localeCompare(this.attachmentSortVal(y));
        };
    }

    private static rankComparator(filter: Filter): EntryComparator {
        return function (x, y) {
            return y.getRank(filter) - x.getRank(filter);
        };
    }

    private static attachmentSortVal(entry: Entry): string {
        const att = entry.attachments;
        let str = att?.length ? String.fromCharCode(64 + att.length) : 'Z';
        if (att?.[0]) {
            str += att[0].title;
        }
        return str;
    }
}
