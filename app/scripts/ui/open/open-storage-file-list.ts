import { h, FunctionComponent } from 'preact';
import { OpenStorageFileListView } from 'views/open/open-storage-file-list-view';
import { UrlFormat } from 'util/formatting/url-format';
import { useState } from 'preact/hooks';

export interface OpenStorageFileListFile {
    path: string;
    name: string;
    dir?: boolean;
}

export const OpenStorageFileList: FunctionComponent<{
    files: OpenStorageFileListFile[];

    fileSelected: (file: OpenStorageFileListFile) => void;
}> = ({ files: inputFiles, fileSelected }) => {
    const [showHiddenFiles, setShowHiddenFiles] = useState(false);

    let files = inputFiles.map((file) => {
        return {
            path: file.path,
            name: file.name.replace(/\.kdbx$/i, ''),
            kdbx: UrlFormat.isKdbx(file.name),
            dir: file.dir
        };
    });
    const visibleFiles = files.filter((f) => f.dir || f.kdbx);
    const canShowHiddenFiles = visibleFiles.length > 0 && files.length > visibleFiles.length;
    if (!showHiddenFiles) {
        if (visibleFiles.length > 0) {
            files = visibleFiles;
        }
    }
    const density = files.length > 14 ? 3 : files.length > 7 ? 2 : 1;

    const showHiddenFilesChanged = () => {
        setShowHiddenFiles(!showHiddenFiles);
    };

    return h(OpenStorageFileListView, {
        density,
        files,
        canShowHiddenFiles,
        showHiddenFiles,

        fileSelected,
        showHiddenFilesChanged
    });
};
