import { FunctionComponent, h } from 'preact';
import { GlobalShortcutDef, SettingsShortcutsView } from 'views/settings/settings-shortcuts-view';
import { Features } from 'util/features';
import { Launcher } from 'comp/launcher';
import { GlobalShortcutType, Shortcuts } from 'comp/browser/shortcuts';
import { Locale } from 'util/locale';
import { useModelWatcher } from 'util/ui/hooks';
import { AppSettings } from 'models/app-settings';
import { useState } from 'preact/hooks';

function getGlobalShortcuts(): GlobalShortcutDef[] {
    return [
        {
            id: 'autoType',
            title: Locale.setShAutoTypeGlobal,
            value: Shortcuts.globalShortcutText('autoType', true)
        },
        {
            id: 'copyPassword',
            title: Locale.setShCopyPassOnly,
            value: Shortcuts.globalShortcutText('copyPassword', true)
        },
        {
            id: 'copyUser',
            title: Locale.setShCopyUser,
            value: Shortcuts.globalShortcutText('copyUser', true)
        },
        {
            id: 'copyUrl',
            title: Locale.setShCopyUrl,
            value: Shortcuts.globalShortcutText('copyUrl', true)
        },
        {
            id: 'copyOtp',
            title: Locale.setShCopyOtp,
            value: Shortcuts.globalShortcutText('copyOtp', true)
        },
        {
            id: 'restoreApp',
            title: Locale.setShRestoreApp.with('KeeWeb'),
            value: Shortcuts.globalShortcutText('restoreApp', true)
        }
    ];
}

export const SettingsShortcuts: FunctionComponent = () => {
    useModelWatcher(AppSettings);
    const [editedShortcut, setEditedShortcut] = useState('');

    const shortcutClicked = (id: GlobalShortcutType) => {
        setEditedShortcut(editedShortcut === id ? '' : id);
    };

    const shortcutChanged = (id: GlobalShortcutType, shortcut: string) => {
        Shortcuts.setGlobalShortcut(id, shortcut);
        setEditedShortcut('');
    };

    const shortcutReset = (id: GlobalShortcutType) => {
        Shortcuts.setGlobalShortcut(id, null);
        setEditedShortcut('');
    };

    return h(SettingsShortcutsView, {
        cmd: Shortcuts.actionShortcutSymbol(true),
        alt: Shortcuts.altShortcutSymbol(true),
        globalIsLarge: !Features.isMac,
        autoTypeSupported: !!Launcher,
        globalShortcuts: Launcher ? getGlobalShortcuts() : undefined,
        editedShortcut,

        shortcutClicked,
        shortcutChanged,
        shortcutReset
    });
};
