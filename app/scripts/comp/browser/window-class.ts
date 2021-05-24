import { Features } from 'util/features';
import { AppSettings } from 'models/app-settings';

export const WindowClass = {
    addWindowClasses(): void {
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
    }
};
