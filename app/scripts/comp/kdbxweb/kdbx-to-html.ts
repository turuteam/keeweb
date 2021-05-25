import { h } from 'preact';
import * as kdbxweb from 'kdbxweb';
import { RuntimeInfo } from 'const/runtime-info';
import { Links } from 'const/links';
import { DateFormat } from 'util/formatting/date-format';
import { StringFormat } from 'util/formatting/string-format';
import { Locale } from 'util/locale';
import { HtmlRenderer } from 'util/browser/html-renderer';
import { ExportFile } from 'views/standalone/export-file';
import { ExportEntry, ExportEntryParameters } from 'views/standalone/export-entry';

const FieldMapping = [
    { name: 'UserName', loc: () => Locale.user },
    { name: 'Password', loc: () => Locale.password, protect: true },
    { name: 'URL', loc: () => Locale.website },
    { name: 'Notes', loc: () => Locale.notes }
];

const KnownFields = new Set('Title');
for (const { name } of FieldMapping) {
    KnownFields.add(name);
}

function convertEntry(db: kdbxweb.Kdbx, entry: kdbxweb.KdbxEntry): ExportEntryParameters {
    const path = getParents(entry).join(' / ');
    const fields = [];
    for (const field of FieldMapping) {
        const value = entryField(entry, field.name);
        if (value) {
            fields.push({
                title: StringFormat.capFirst(field.loc()),
                value,
                protect: field.protect
            });
        }
    }
    for (const [fieldName, fieldValue] of entry.fields) {
        if (!KnownFields.has(fieldName)) {
            const value = entryField(entry, fieldName);
            if (value) {
                fields.push({
                    title: fieldName,
                    value,
                    protect: fieldValue instanceof kdbxweb.ProtectedValue
                });
            }
        }
    }
    const title = entryField(entry, 'Title');
    let expires;
    if (entry.times.expires && entry.times.expiryTime) {
        expires = DateFormat.dtStr(entry.times.expiryTime);
    }

    const attachments = [...entry.binaries]
        .map(([name, data]) => {
            let value;
            if (kdbxweb.KdbxBinaries.isKdbxBinaryWithHash(data)) {
                value = data.value;
            } else {
                value = data;
            }
            if (value instanceof kdbxweb.ProtectedValue) {
                value = value.getBinary();
            }
            let dataHref = '';
            if (value) {
                const base64 = kdbxweb.ByteUtils.bytesToBase64(value);
                dataHref = 'data:application/octet-stream;base64,' + base64;
            }
            return { name, dataHref };
        })
        .filter((att) => att.name && att.dataHref);

    return {
        id: entry.uuid.id,
        path,
        title,
        fields,
        tags: entry.tags,
        created: entry.times.creationTime ? DateFormat.dtStr(entry.times.creationTime) : '',
        modified: entry.times.lastModTime ? DateFormat.dtStr(entry.times.lastModTime) : '',
        expires,
        attachments
    };
}

function entryField(entry: kdbxweb.KdbxEntry, fieldName: string): string {
    const value = entry.fields.get(fieldName);
    if (value instanceof kdbxweb.ProtectedValue) {
        return value.getText();
    }
    return value || '';
}

function getParents(entry: kdbxweb.KdbxEntry): string[] {
    const parents = [];
    const group = entry.parentGroup;
    while (group?.name) {
        parents.push(group.name);
    }
    return parents;
}

const KdbxToHtml = {
    convert(db: kdbxweb.Kdbx, name: string): string {
        const entries: ExportEntryParameters[] = [];
        for (const group of db.groups) {
            if (
                group.uuid.equals(db.meta.recycleBinUuid) ||
                group.uuid.equals(db.meta.entryTemplatesGroup)
            ) {
                continue;
            }
            for (const entry of group.allEntries()) {
                entries.push(convertEntry(db, entry));
            }
        }
        return HtmlRenderer.renderToHtml(
            h(ExportFile, {
                name,
                date: DateFormat.dtStr(Date.now()),
                appVersion: RuntimeInfo.version,
                appLink: Links.Homepage,
                entries
            })
        );
    },

    entryToHtml(db: kdbxweb.Kdbx, entry: kdbxweb.KdbxEntry): string {
        const params = convertEntry(db, entry);
        return HtmlRenderer.renderToHtml(h(ExportEntry, params));
    }
};

export { KdbxToHtml };
