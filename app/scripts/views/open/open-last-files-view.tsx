import { FunctionComponent } from 'preact';

interface LastOpenFile {
    id: string;
    name: string;
    path?: string;
    icon?: string;
}

export const OpenLastFilesView: FunctionComponent<{
    lastOpenFiles: LastOpenFile[];
    canRemoveLatest: boolean;
}> = ({ lastOpenFiles, canRemoveLatest }) => {
    let tabIndex = 0;

    return (
        <div class="open__last">
            {lastOpenFiles.map((file) => (
                <div key={file.id} class="open__last-item" tabIndex={++tabIndex}>
                    {file.path ? <kw-tip text={file.path} /> : null}
                    {file.icon ? <i class={`fa fa-${file.icon} open__last-item-icon`} /> : null}
                    <span class="open__last-item-text">{file.name}</span>
                    {canRemoveLatest ? <i class="fa fa-times open__last-item-icon-del" /> : null}
                </div>
            ))}
        </div>
    );
};
