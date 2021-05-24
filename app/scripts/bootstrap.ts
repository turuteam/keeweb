/* eslint-disable import/first */
if (process.env.NODE_ENV === 'development') {
    require('preact/debug');
}
import { h, render } from 'preact';
import { App } from 'ui/app';
import { Events } from 'util/events';
import { StartProfiler } from 'comp/app/start-profiler';
import { AppRightsChecker } from 'comp/app/app-rights-checker';
import { ExportApi } from 'comp/app/export-api';
import { SingleInstanceChecker } from 'comp/app/single-instance-checker';
import { FocusDetector } from 'comp/browser/focus-detector';
import { IdleTracker } from 'comp/browser/idle-tracker';
import { ThemeWatcher } from 'comp/browser/theme-watcher';
import { KeyHandler } from 'comp/browser/key-handler';
import { PopupNotifier } from 'comp/browser/popup-notifier';
import { SettingsManager } from 'comp/settings/settings-manager';
import { Alerts } from 'comp/ui/alerts';
import { AppSettings } from 'models/app-settings';
import { RuntimeData } from 'models/runtime-data';
import { Features } from 'util/features';
import { KdbxwebInit } from 'comp/kdbxweb/kdbxweb-init';
import { Locale } from 'util/locale';
import { Logger } from 'util/logger';
import { FeatureTester } from 'util/browser/feature-tester';
import { UsbListener } from 'comp/devices/usb-listener';
import { noop } from 'util/fn';
/* eslint-enable */

declare global {
    interface Window {
        kw: typeof ExportApi;
    }
}

StartProfiler.milestone('loading modules');

document.addEventListener('DOMContentLoaded', () => {
    bootstrap().catch(noop);
});

async function bootstrap() {
    StartProfiler.milestone('document ready');

    const logger = new Logger('bootstrap');

    try {
        await loadConfigs();
        initModules();
        // await loadRemoteConfig();
        await ensureCanRun();
        initUsbListener();
        await showApp();
        postInit();
    } catch (e) {
        logger.error('Error starting app', e);
    }

    async function ensureCanRun() {
        if (Features.isFrame && !AppSettings.allowIframes) {
            return Promise.reject(
                'Running in iframe is not allowed (this can be changed in the app config).'
            );
        }
        try {
            await FeatureTester.test();
            StartProfiler.milestone('checking features');
        } catch (e) {
            Alerts.error({
                header: Locale.appSettingsError,
                body: Locale.appNotSupportedError,
                pre: String(e),
                buttons: [],
                esc: undefined,
                enter: undefined,
                click: undefined
            });
            logger.error('Feature test failed', e);
            throw new Error(`Feature test failed`);
        }
    }

    function loadConfigs() {
        return Promise.all([
            AppSettings.init(),
            RuntimeData.init()
            // UpdateModel.load(),
            // FileInfoCollection.load()
        ]).then(() => {
            StartProfiler.milestone('loading configs');
        });
    }

    function initModules() {
        KeyHandler.init();
        PopupNotifier.init();
        KdbxwebInit.init();
        FocusDetector.init();
        // AutoType.init();
        ThemeWatcher.init();
        SettingsManager.init();
        window.kw = ExportApi;
        // await PluginManager.init()
        StartProfiler.milestone('initializing modules');
    }

    // function showSettingsLoadError() {
    //     Alerts.error({
    //         header: Locale.appSettingsError,
    //         body: Locale.appSettingsErrorBody,
    //         buttons: [],
    //         esc: undefined,
    //         enter: undefined,
    //         click: undefined
    //     });
    // }
    //
    // function loadRemoteConfig() {
    //     return Promise.resolve()
    //         .then(() => {
    //             SettingsManager.setBySettings();
    //             const configParam = getConfigParam();
    //             if (configParam) {
    //                 return appModel
    //                     .loadConfig(configParam)
    //                     .then(() => {
    //                         SettingsManager.setBySettings();
    //                     })
    //                     .catch((e) => {
    //                         if (!appModel.settings.cacheConfigSettings) {
    //                             showSettingsLoadError();
    //                             throw e;
    //                         }
    //                     });
    //             }
    //         })
    //         .then(() => {
    //             StartProfiler.milestone('loading remote config');
    //         });
    // }

    function initUsbListener() {
        UsbListener.init();
        StartProfiler.milestone('starting usb');
    }

    function showApp() {
        return Promise.resolve().then(() => {
            const skipHttpsWarning = AppSettings.skipHttpsWarning;
            const protocolIsInsecure = ['https:', 'file:', 'app:'].indexOf(location.protocol) < 0;
            const hostIsInsecure = location.hostname !== 'localhost';
            if (protocolIsInsecure && hostIsInsecure && !skipHttpsWarning) {
                return new Promise<void>((resolve) => {
                    Alerts.error({
                        header: Locale.appSecWarn,
                        icon: 'user-secret',
                        esc: undefined,
                        enter: undefined,
                        click: undefined,
                        body: Locale.appSecWarnBody1 + '\n\n' + Locale.appSecWarnBody2,
                        buttons: [{ result: '', title: Locale.appSecWarnBtn, error: true }],
                        complete: () => {
                            resolve(showView());
                        }
                    });
                });
            } else {
                return showView().then(
                    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
                );
            }
        });
    }

    function postInit() {
        // Updater.init();
        SingleInstanceChecker.init();
        AppRightsChecker.init().catch(noop);
        IdleTracker.init();
        // BrowserExtensionConnector.init(appModel);
        // PluginManager.runAutoUpdate(); // TODO: timeout
    }

    function showView() {
        const root = document.querySelector('.app');
        if (root) {
            const app = h(App, null);
            render(app, document.body, root);
        }
        StartProfiler.milestone('first view rendering');

        Events.emit('app-ready');
        StartProfiler.milestone('app ready event');

        StartProfiler.report();

        return Promise.resolve();
    }

    // function getConfigParam() {
    //     const metaConfig = document.head.querySelector('meta[name=kw-config]');
    //     if (metaConfig && metaConfig.content && metaConfig.content[0] !== '(') {
    //         return metaConfig.content;
    //     }
    //     const match = location.search.match(/[?&]config=([^&]+)/i);
    //     if (match && match[1]) {
    //         return match[1];
    //     }
    // }
}
