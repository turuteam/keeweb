import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { classes } from 'util/ui/classes';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Keys } from 'const/keys';
import { Shortcuts } from 'comp/browser/shortcuts';

const SystemShortcuts = [
    'Meta+A',
    'Alt+A',
    'Alt+C',
    'Alt+D',
    'Meta+F',
    'Meta+C',
    'Meta+B',
    'Meta+U',
    'Meta+T',
    'Alt+N',
    'Meta+O',
    'Meta+S',
    'Meta+G',
    'Meta+,',
    'Meta+L'
];

export const ShortcutEditor: FunctionComponent<{
    shortcut: string;
    large: boolean;

    onSet: (shortcut: string) => void;
    onClear: () => void;
}> = ({ shortcut, large, onSet, onClear }) => {
    const shortcutInput = useRef<HTMLInputElement>();

    const [shortcutExists, setShortcutExists] = useState(false);

    useLayoutEffect(() => {
        shortcutInput.current.focus();
    }, []);

    const inputKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (e.which === Keys.DOM_VK_DELETE || e.which === Keys.DOM_VK_BACK_SPACE) {
            onClear();
            return;
        }
        if (e.which === Keys.DOM_VK_ESCAPE) {
            shortcutInput.current.blur();
            return;
        }

        const shortcut = Shortcuts.keyEventToShortcut(e);
        const presentableShortcutText = Shortcuts.presentShortcut(shortcut.value);

        shortcutInput.current.value = presentableShortcutText;

        const exists = SystemShortcuts.includes(shortcut.value);
        setShortcutExists(exists);

        const isValid = shortcut.valid && !exists;
        if (isValid) {
            onSet(shortcut.value);
        }
    };

    return (
        <div class="shortcut__editor">
            <div>{Locale.setShEdit}</div>
            <input
                ref={shortcutInput}
                class={classes({
                    'shortcut__editor-input': true,
                    'shortcut__editor-input--large': large,
                    'input--error': shortcutExists
                })}
                value={shortcut}
                onKeyPress={(e) => e.preventDefault()}
                onKeyDown={inputKeyDown}
            />
        </div>
    );
};
