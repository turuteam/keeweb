import * as kdbxweb from 'kdbxweb';
import { BuiltInFields } from 'const/entry-fields';
import { AdvancedFilter, Filter } from 'models/filter';
import { Entry } from 'models/entry';

interface SearchContext {
    matches: string[];
}

export const EntryMatcher = { matches };

const BuiltInFieldsSet = new Set<string>(BuiltInFields);

function matches(entry: Entry, filter: Filter): boolean {
    if (filter.tagLower) {
        if (entry.searchTags && entry.searchTags.indexOf(filter.tagLower) < 0) {
            return false;
        }
    }
    if (filter.textLower) {
        if (filter.advanced) {
            if (!matchesAdv(entry, filter)) {
                return false;
            }
        } else if (filter.textLowerParts) {
            const parts = filter.textLowerParts;
            for (let i = 0; i < parts.length; i++) {
                if (!entry.searchText?.includes(parts[i])) {
                    return false;
                }
            }
        } else if (!entry.searchText?.includes(filter.textLower)) {
            return false;
        }
    }
    if (filter.color) {
        if (filter.color === '*') {
            if (!entry.searchColor) {
                return false;
            }
        } else if (entry.searchColor !== filter.color) {
            return false;
        }
    }
    if (filter.autoType) {
        if (!entry.autoTypeEnabled) {
            return false;
        }
    }
    if (filter.otp) {
        if (
            !entry.fields?.has('otp') &&
            !entry.fields?.has('TOTP Seed') &&
            entry.backend !== 'otp-device'
        ) {
            return false;
        }
    }
    return true;
}

function matchesAdv(entry: Entry, filter: Filter): boolean {
    const adv = filter.advanced;
    if (!adv || !filter.text || !filter.textLower) {
        return false;
    }
    let compare: (val: kdbxweb.KdbxEntryField) => boolean;
    const context: SearchContext = { matches: [] };
    if (adv.regex) {
        try {
            const regex = new RegExp(filter.text, adv.cs ? '' : 'i');
            compare = (val) => matchRegex(val, regex);
        } catch (e) {
            return false;
        }
    } else if (adv.cs) {
        if (filter.textParts) {
            const textParts = filter.textParts;
            compare = (val) => matchStringMulti(val, textParts, context, false);
        } else {
            const text = filter.text;
            compare = (val) => matchString(val, text);
        }
    } else if (filter.textLowerParts) {
        const textLowerParts = filter.textLowerParts;
        compare = (val) => matchStringMultiLower(val, textLowerParts, context);
    } else {
        const textLower = filter.textLower;
        compare = (val) => matchStringLower(val, textLower);
    }
    if (matchFields(entry.getAllFields(), adv, compare)) {
        return true;
    }
    if (adv.history && entry.getAllHistoryEntriesFields) {
        for (const historyEntryFields of entry.getAllHistoryEntriesFields()) {
            if (matchFields(historyEntryFields, adv, compare)) {
                return true;
            }
        }
    }
    return false;
}

function matchString(str: kdbxweb.KdbxEntryField, find: string): boolean {
    if (str instanceof kdbxweb.ProtectedValue) {
        return str.includes(find);
    }
    return str.includes(find);
}

function matchStringLower(str: kdbxweb.KdbxEntryField, findLower: string): boolean {
    if (str instanceof kdbxweb.ProtectedValue) {
        return str.includesLower(findLower);
    }
    return str.toLowerCase().includes(findLower);
}

function matchStringMulti(
    str: kdbxweb.KdbxEntryField,
    find: string[],
    context: SearchContext,
    lower: boolean
): boolean {
    for (let i = 0; i < find.length; i++) {
        const item = find[i];
        const strMatches = lower ? matchStringLower(str, item) : matchString(str, item);
        if (strMatches) {
            if (context.matches) {
                if (!context.matches.includes(item)) {
                    context.matches.push(item);
                }
            } else {
                context.matches = [item];
            }
        }
    }
    return context.matches && context.matches.length === find.length;
}

function matchStringMultiLower(
    str: kdbxweb.KdbxEntryField,
    find: string[],
    context: SearchContext
): boolean {
    return matchStringMulti(str, find, context, true);
}

function matchRegex(str: kdbxweb.KdbxEntryField, regex: RegExp): boolean {
    if (str instanceof kdbxweb.ProtectedValue) {
        str = str.getText();
    }
    return regex.test(str);
}

function matchFields(
    fields: Map<string, kdbxweb.KdbxEntryField>,
    adv: AdvancedFilter,
    compare: (val: kdbxweb.KdbxEntryField) => boolean
): boolean {
    if (adv.user && matchField(fields.get('UserName'), compare)) {
        return true;
    }
    if (adv.url && matchField(fields.get('URL'), compare)) {
        return true;
    }
    if (adv.notes && matchField(fields.get('Notes'), compare)) {
        return true;
    }
    if (adv.pass && matchField(fields.get('Password'), compare)) {
        return true;
    }
    if (adv.title && matchField(fields.get('Title'), compare)) {
        return true;
    }
    if (adv.other || adv.protect) {
        for (const [field, value] of fields) {
            if (BuiltInFieldsSet.has(field)) {
                if (typeof value === 'string') {
                    if (adv.other && matchField(value, compare)) {
                        return true;
                    }
                } else if (adv.protect && matchField(value, compare)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function matchField(
    val: kdbxweb.KdbxEntryField | undefined,
    compare: (val: kdbxweb.KdbxEntryField) => boolean
): boolean {
    return val ? compare(val) : false;
}
