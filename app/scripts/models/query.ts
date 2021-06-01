import { DefaultModelEvents, Model } from 'util/model';
import { Filter } from 'models/filter';
import { Entry } from 'models/entry';
import { AppSettings } from 'models/app-settings';

interface QueryEvents extends DefaultModelEvents {
    'results-updated': () => void;
}

export class Query extends Model<QueryEvents> {
    readonly filter = new Filter();
    private _results?: Entry[];
    private _preparingFilter?: boolean;

    constructor() {
        super();
        this.filter.on('change', () => this.filterChanged());
    }

    get results(): Entry[] {
        if (!this._results) {
            this._results = this.getResults();
        }
        return this._results;
    }

    reset(): void {
        this.filter.reset();
    }

    updateResults(): void {
        this._results = undefined;
        this.emit('results-updated');
    }

    private filterChanged() {
        if (!this._preparingFilter) {
            this.updateResults();
        }
    }

    private getResults(): Entry[] {
        this.prepareFilter();
        // const entries = this.getEntries(); // TODO: filtering
        // if (!this.activeEntryId || !entries.get(this.activeEntryId)) {
        //     const firstEntry = entries[0];
        //     this.activeEntryId = firstEntry ? firstEntry.id : null;
        // }
        // Events.emit('filter', { filter: this.filter, sort: this.sort, entries });
        // Events.emit('entry-selected', entries.get(this.activeEntryId));
        return [];
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
}
