import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';

export const OpenDropzoneView: FunctionComponent = () => {
    return (
        <div class="open__dropzone">
            <i class="fa fa-lock muted-color open__dropzone-icon" />
            <h1 class="muted-color open__dropzone-header">{Locale.openDropHere}</h1>
        </div>
    );
};
