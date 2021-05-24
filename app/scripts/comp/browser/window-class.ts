import { Features } from 'util/features';
import { AppSettings } from 'models/app-settings';
import { Events } from 'util/events';

export const WindowClass = {
    init(): void {
        const browserCssClass = Features.browserCssClass;
        if (browserCssClass) {
            document.body.classList.add(browserCssClass);
        }
        if (AppSettings.titlebarStyle !== 'default') {
            document.body.classList.add(`titlebar-${AppSettings.titlebarStyle}`);
            if (Features.renderCustomTitleBar) {
                document.body.classList.add('titlebar-custom');
            }
        }
        if (Features.isMobile) {
            document.body.classList.add('mobile');
        }

        Events.on('enter-full-screen', () => document.body.classList.add('fullscreen'));
        Events.on('leave-full-screen', () => document.body.classList.remove('fullscreen'));
    }
};
