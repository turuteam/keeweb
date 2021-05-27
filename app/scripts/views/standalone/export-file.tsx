import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { LocalizedWith } from 'views/helpers/localized-with';
import { ExportEntry, ExportEntryParameters } from './export-entry';

export const ExportFile: FunctionComponent<{
    name: string;
    date: string;
    appVersion: string;
    appLink: string;
    entries: ExportEntryParameters[];
}> = ({ name, date, appVersion, appLink, entries }) => {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <title>{{ name }}</title>
                <meta
                    http-equiv="Content-Security-Policy"
                    content="script-src 'none'; img-src data:; style-src 'unsafe-inline';"
                />
                <link
                    href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII="
                    rel="icon"
                    type="image/x-icon"
                />
                <style>{`
            body {
            font-family: -apple-system, "BlinkMacSystemFont", "Helvetica Neue", "Helvetica", "Roboto", "Arial", sans-serif;
            font-size: 14px;
            padding: 10px 20px;
        }
            table {
            border-collapse: collapse;
            border: 1px solid #ccc;
            width: 100%;
        }
            td {
            border: 1px solid #ccc;
            padding: 8px 16px;
        }
            tr:nth-of-type(even) {
            background: #fafafa;
        }
            td:first-of-type {
            width: 30%;
        }
            td.field {
            white-space: pre-wrap;
        }
            footer {
            margin-top: 10px;
        }
`}</style>
            </head>
            <body>
                <h1>{{ name }}</h1>
                <h2>{Locale.exportFileInfo}</h2>
                <table>
                    <tr>
                        <td>{Locale.exportHtmlName}</td>
                        <td>{{ name }}</td>
                    </tr>
                    <tr>
                        <td>{Locale.exportHtmlDate}</td>
                        <td>{{ date }}</td>
                    </tr>
                    <tr>
                        <td>{Locale.exportGenerator}</td>
                        <td>KeeWeb v{{ appVersion }}</td>
                    </tr>
                </table>
                <h2>{Locale.exportEntries}</h2>
                <div>
                    {entries.map((entry) => (
                        <ExportEntry key={entry.id} {...entry} />
                    ))}
                </div>
                <footer>
                    <LocalizedWith str={Locale.exportDescription}>
                        <a href={appLink} rel="noreferrer noopener" target="_blank">
                            KeeWeb
                        </a>
                    </LocalizedWith>
                </footer>
            </body>
        </html>
    );
};
