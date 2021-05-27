import { FunctionComponent } from 'preact';
import { KeeWebLogo } from 'const/inline-images';

export const TitlebarView: FunctionComponent<{
    maximized: boolean;
    onMinimize: () => void;
    onRestore: () => void;
    onMaximize: () => void;
    onClose: () => void;
}> = ({ maximized, onMinimize, onRestore, onMaximize, onClose }) => {
    return (
        <div class="titlebar">
            <div class="titlebar__icon">
                <img src={KeeWebLogo} alt="logo" class="titlebar__logo" />
            </div>

            <div class="titlebar__grow" />

            <i class="fa fa-titlebar-minimize titlebar__minimize" onClick={onMinimize} />
            {maximized ? (
                <i class="fa fa-titlebar-restore titlebar__restore" onClick={onRestore} />
            ) : (
                <i class="fa fa-titlebar-maximize titlebar__maximize" onClick={onMaximize} />
            )}
            <i class="fa fa-titlebar-close titlebar__close" onClick={onClose} />
        </div>
    );
};
