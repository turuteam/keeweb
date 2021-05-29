import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';

export const OpenDropzoneView: FunctionComponent<{
    onDragOver: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
}> = ({ onDragOver, onDragLeave, onDrop }) => {
    return (
        <div
            class="open__dropzone"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <i class="fa fa-lock muted-color open__dropzone-icon" />
            <h1 class="muted-color open__dropzone-header">{Locale.openDropHere}</h1>
        </div>
    );
};
