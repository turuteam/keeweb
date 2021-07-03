import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { classes } from 'util/ui/classes';
import { withoutPropagation } from 'util/ui/events';

interface OpenStorageFileListViewFile {
    name: string;
    path: string;
    dir?: boolean;
    kdbx?: boolean;
}

export const OpenStorageFileListView: FunctionComponent<{
    density: 1 | 2 | 3;
    files: OpenStorageFileListViewFile[];
    canShowHiddenFiles: boolean;
    showHiddenFiles: boolean;

    fileSelected: (file: OpenStorageFileListViewFile) => void;
    showHiddenFilesChanged: () => void;
}> = ({
    density,
    files,
    canShowHiddenFiles,
    showHiddenFiles,

    fileSelected,
    showHiddenFilesChanged
}) => {
    const fileClicked = (e: MouseEvent) => {
        if (!(e.target instanceof HTMLElement)) {
            return;
        }
        const withPath = e.target.closest('[data-path]');
        if (!(withPath instanceof HTMLElement)) {
            return;
        }
        const path = withPath.dataset.path;
        const file = files.find((f) => f.path === path);
        if (file) {
            fileSelected(file);
        }
    };

    return (
        <div class={`open-list open-list--density${density}`}>
            <div class="open-list__content" onClick={fileClicked}>
                <div class="open-list__scrollable">
                    <div class="open-list__files">
                        {files
                            .filter((file) => file.dir)
                            .map((file) => (
                                <div key={file.path} class="open-list__file" data-path={file.path}>
                                    <i
                                        class={classes({
                                            'open-list__file-icon': true,
                                            'fa': true,
                                            'fa-arrow-left': file.name === '..',
                                            'fa-folder-o': file.name !== '..'
                                        })}
                                    />{' '}
                                    <span class="open-list__file-text">{file.name}</span>
                                </div>
                            ))}
                    </div>
                    <div class="open-list__files">
                        {files
                            .filter((file) => !file.dir)
                            .map((file) => (
                                <div
                                    key={file.path}
                                    class={classes({
                                        'open-list__file': true,
                                        'open-list__file--another': !file.kdbx
                                    })}
                                    data-path={file.path}
                                >
                                    <i
                                        class={classes({
                                            'open-list__file-icon': true,
                                            'fa': true,
                                            'fa-keeweb': file.kdbx,
                                            'fa-file-alt-o': !file.kdbx
                                        })}
                                    />{' '}
                                    <span class="open-list__file-text">{file.name}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
            {canShowHiddenFiles ? (
                <div class="open-list__check-wrap">
                    <input
                        type="checkbox"
                        id="open-list__check"
                        checked={showHiddenFiles}
                        onClick={withoutPropagation(showHiddenFilesChanged)}
                    />
                    <label
                        class="open-list__check-label"
                        for="open-list__check"
                        onClick={withoutPropagation()}
                    >
                        {Locale.openShowAllFiles}
                    </label>
                </div>
            ) : null}
        </div>
    );
};
