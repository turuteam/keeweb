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
}

export class Filter extends Model {
    text?: string;
    textParts?: string[];
    textLower?: string;
    textLowerParts?: string[];
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
}
