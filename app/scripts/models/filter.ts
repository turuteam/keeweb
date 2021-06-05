import { Model } from 'util/model';
import { InitWithFieldsOf } from 'util/types';

export interface AdvancedFilter {
    cs?: boolean;
    regex?: boolean;
    user?: boolean;
    url?: boolean;
    notes?: boolean;
    pass?: boolean;
    title?: boolean;
    other?: boolean;
    protect?: boolean;
    history?: boolean;
    exact?: boolean;
}

export const DefaultAdvancedFilter: AdvancedFilter = {
    user: true,
    url: true,
    notes: true,
    title: true,
    other: true
};

export class Filter extends Model {
    text?: string;
    textParts?: string[];
    textLower?: string;
    textLowerParts?: string[];
    tag?: string;
    tagLower?: string;
    advanced?: AdvancedFilter;
    color?: string;
    autoType?: boolean;
    otp?: boolean;
    includeDisabled?: boolean;
    trash?: boolean;
    group?: string;
    subGroups?: boolean;

    constructor(values?: InitWithFieldsOf<Filter>) {
        super();
        Object.assign(this, values);
    }

    reset(): void {
        this.batchSet(() => {
            for (const key of Object.keys(this)) {
                delete this[key as keyof Filter];
            }
        });
    }
}
