import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { classes } from 'util/ui/classes';
import { ShortcutEditor } from 'views/components/shortcut-editor';
import { GlobalShortcutType } from 'comp/browser/shortcuts';

export interface GlobalShortcutDef {
    id: GlobalShortcutType;
    value: string;
    title: string;
}

export const SettingsShortcutsView: FunctionComponent<{
    cmd: string;
    alt: string;
    autoTypeSupported: boolean;
    globalShortcuts?: GlobalShortcutDef[];
    globalIsLarge: boolean;
    editedShortcut?: string;

    shortcutClicked: (id: GlobalShortcutType) => void;
    shortcutChanged: (id: GlobalShortcutType, shortcut: string) => void;
    shortcutReset: (id: GlobalShortcutType) => void;
}> = ({
    cmd,
    alt,
    autoTypeSupported,
    globalShortcuts,
    globalIsLarge,
    editedShortcut,

    shortcutClicked,
    shortcutChanged,
    shortcutReset
}) => {
    return (
        <div class="settings__content">
            <h1>
                <i class="fa fa-keyboard settings__head-icon" /> {Locale.setShTitle}
            </h1>
            <div>
                <span class="shortcut">{cmd}A</span> {Locale.or}{' '}
                <span class="shortcut">{alt}A</span> {Locale.setShShowAll}
            </div>
            <div>
                <span class="shortcut">{alt}C</span> {Locale.setShColors}
            </div>
            <div>
                <span class="shortcut">{alt}D</span> {Locale.setShTrash}
            </div>
            <div>
                <span class="shortcut">{cmd}F</span> {Locale.setShFind}
            </div>
            <div>
                <span class="shortcut">esc</span> {Locale.setShClearSearch}
            </div>
            <div>
                <span class="shortcut">{cmd}C</span> {Locale.setShCopyPass}
            </div>
            <div>
                <span class="shortcut">{cmd}B</span> {Locale.setShCopyUser}
            </div>
            <div>
                <span class="shortcut">{cmd}U</span> {Locale.setShCopyUrl}
            </div>
            <div>
                <span class="shortcut">{alt}2</span> {Locale.setShCopyOtp}
            </div>
            {autoTypeSupported ? (
                <div>
                    <span class="shortcut">{cmd}T</span> {Locale.setShAutoType}
                </div>
            ) : null}
            <div>
                <span class="shortcut">&uarr;</span> {Locale.setShPrev}
            </div>
            <div>
                <span class="shortcut">&darr;</span> {Locale.setShNext}
            </div>
            <div>
                <span class="shortcut">{alt}N</span> {Locale.setShCreateEntry}
            </div>
            <div>
                <span class="shortcut">{cmd}O</span> {Locale.setShOpen}
            </div>
            <div>
                <span class="shortcut">{cmd}S</span> {Locale.setShSave}
            </div>
            <div>
                <span class="shortcut">{cmd}G</span> {Locale.setShGen}
            </div>
            <div>
                <span class="shortcut">{cmd},</span> {Locale.setShSet}
            </div>
            <div>
                <span class="shortcut">{cmd}L</span> {Locale.setShLock}
            </div>

            {globalShortcuts ? (
                <>
                    <p>{Locale.setShGlobal}</p>
                    {globalShortcuts.map((sh) => (
                        <div key={sh.id}>
                            <button
                                class={classes({
                                    'shortcut': true,
                                    'btn-silent': true,
                                    'shortcut-large': globalIsLarge
                                })}
                                onClick={() => shortcutClicked(sh.id)}
                            >
                                {sh.value}
                            </button>{' '}
                            {sh.title}
                            {sh.id === editedShortcut ? (
                                <ShortcutEditor
                                    shortcut={sh.value}
                                    large={globalIsLarge}
                                    onSet={(shortcut) => shortcutChanged(sh.id, shortcut)}
                                    onClear={() => shortcutReset(sh.id)}
                                />
                            ) : null}
                        </div>
                    ))}
                </>
            ) : null}
        </div>
    );
};
