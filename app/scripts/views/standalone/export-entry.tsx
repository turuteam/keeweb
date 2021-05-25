import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { StringFormat } from 'util/formatting/string-format';

export interface ExportEntryField {
    title: string;
    protect?: boolean;
    value: string;
}

export interface ExportEntryAttachment {
    name: string;
    dataHref: string;
}

export interface ExportEntryParameters {
    id: string;
    title: string;
    fields: ExportEntryField[];
    tags?: string[];
    path?: string;
    created: string;
    modified: string;
    expires?: string;
    attachments?: ExportEntryAttachment[];
}

export const ExportEntry: FunctionComponent<ExportEntryParameters> = ({
    title,
    fields,
    tags,
    path,
    created,
    modified,
    expires,
    attachments
}) => {
    return (
        <>
            <h2>{title || StringFormat.capFirst(Locale.noTitle)}</h2>
            <table>
                {fields.map((field) => (
                    <tr key={`field-${field.title}`}>
                        <td>{field.title}</td>
                        <td class="field">
                            {field.protect ? <code>{field.value}</code> : field.value}
                        </td>
                    </tr>
                ))}
                {tags?.length ? (
                    <tr key="tags">
                        <td>{StringFormat.capFirst(Locale.tags)}</td>
                        <td>{tags.join(', ')}</td>
                    </tr>
                ) : null}
                {path ? (
                    <tr key="path">
                        <td>{StringFormat.capFirst(Locale.group)}</td>
                        <td>{path}</td>
                    </tr>
                ) : null}
                {attachments?.length ? (
                    <tr key="attachments">
                        <td>{Locale.detAttachments}</td>
                        <td>
                            {attachments.map((att, ix) => (
                                <span key={att.name}>
                                    <a href={att.dataHref} download={att.name}>
                                        {att.name}
                                    </a>
                                    {ix < attachments?.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </td>
                    </tr>
                ) : null}
                <tr key="created">
                    <td>{Locale.detCreated}</td>
                    <td>{created}</td>
                </tr>
                <tr key="modified">
                    <td>{Locale.detUpdated}</td>
                    <td>{modified}</td>
                </tr>
                {expires ? (
                    <tr key="expires">
                        <td>{StringFormat.capFirst(Locale.detExpires)}</td>
                        <td>{expires}</td>
                    </tr>
                ) : null}
            </table>
        </>
    );
};
