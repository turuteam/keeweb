import { h, FunctionComponent } from 'preact';
import { TitlebarView } from 'views/titlebar-view';
import { Launcher } from 'comp/launcher';
import { Events } from 'util/events';
import { useState } from 'preact/hooks';

export const Titlebar: FunctionComponent = () => {
    const [maximized, setMaximized] = useState(Launcher?.mainWindowMaximized ?? false);

    Events.on('app-maximized', () => setMaximized(true));
    Events.on('app-minimized', () => setMaximized(false));

    const onMinimize = () => Launcher?.ipcRenderer.invoke('minimize-main-window');

    const onRestore = () => Launcher?.ipcRenderer.invoke('restore-main-window');

    const onMaximize = () => Launcher?.ipcRenderer.invoke('maximize-main-window');

    const onClose = () => window.close();

    return h(TitlebarView, {
        maximized,
        onMinimize,
        onRestore,
        onMaximize,
        onClose
    });
};
