import { TypedEmitter } from 'tiny-typed-emitter';

export interface GlobalEventSpec {
    'app-ready': () => void;
    'app-minimized': () => void;
    'app-maximized': () => void;
    'app-unmaximized': () => void;
    'dark-mode-changed': (dark: boolean) => void;
    'before-user-idle': () => void;
    'user-idle': () => void;
    'power-monitor-resume': () => void;
    'theme-changed': () => void;
    'locale-changed': (locale: string) => void;
    'native-modules-yubikeys': (numYubiKeys: number) => void;
    'second-instance': () => void;
    'usb-devices-changed': () => void;
    'main-window-focus': () => void;
    'main-window-blur': () => void;
    'main-window-will-close': () => void;
    'keypress': (e: KeyboardEvent) => void;
    'keypress-modal': (e: KeyboardEvent, modal: string) => void;
    'popup-opened': (win: Window) => void;
    'popup-closed': (win: Window, locationSearch?: string) => void;
    'qr-url-read': (url: string) => void;
    'qr-enter-manually': () => void;
    'enter-full-screen': () => void;
    'leave-full-screen': () => void;
    'drag-handle-set': (name: string, size: number | null) => void;
    'plugin-gallery-load-complete': () => void;
    'custom-icon-downloaded': (data: string) => void;
}

class Events extends TypedEmitter<GlobalEventSpec> {
    constructor() {
        super();
        this.setMaxListeners(1000);
    }
}

const instance = new Events();

export { instance as Events };
