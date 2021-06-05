import { FunctionComponent } from 'preact';
import { StringFormat } from 'util/formatting/string-format';
import { Locale } from 'util/locale';
import { AdvancedFilter } from 'models/filter';
import { PropertiesOfType } from 'util/types';
import { useEffect, useRef } from 'preact/hooks';
import { useEvent, useKey } from 'util/ui/hooks';
import { Keys } from 'const/keys';
import { KeyHandler } from 'comp/browser/key-handler';
import { classes } from 'util/ui/classes';
import { withoutPropagation } from 'util/ui/events';

export const ListSearchView: FunctionComponent<{
    canCreate: boolean;
    showAdvanced: boolean;
    searchText: string;
    adv: AdvancedFilter | undefined;

    toggleAdvClicked: () => void;
    advChecked: (field: PropertiesOfType<AdvancedFilter, boolean | undefined>) => void;
    searchChanged: (text: string) => void;
    clearClicked: () => void;
}> = ({
    canCreate,
    showAdvanced,
    searchText,
    adv,

    toggleAdvClicked,
    advChecked,
    searchChanged,
    clearClicked
}) => {
    const input = useRef<HTMLInputElement>();

    useKey(
        Keys.DOM_VK_F,
        () => {
            input.current?.focus();
        },
        KeyHandler.SHORTCUT_ACTION
    );

    useEffect(() => {
        const windowBlur = () => {
            input.current?.blur();
        };
        window.addEventListener('blur', windowBlur);
        return () => window.removeEventListener('blur', windowBlur);
    }, []);

    useEvent('keypress', (e) => {
        const text = e.key;
        if (!text || !input.current || input.current === document.activeElement) {
            return;
        }
        e.preventDefault();
        input.current.focus();
        searchChanged(text);
    });

    const inputFocused = () => {
        input.current?.select();
    };

    const inputKeyDown = (e: KeyboardEvent) => {
        switch (e.which) {
            case Keys.DOM_VK_UP:
            case Keys.DOM_VK_DOWN:
                break;
            case Keys.DOM_VK_RETURN:
                input.current?.blur();
                break;
            case Keys.DOM_VK_ESCAPE:
                searchChanged('');
                input.current?.blur();
                break;
            default:
                return;
        }
        e.preventDefault();
    };

    return (
        <div class="list__search">
            <div class="list__search-header">
                <div class="list__search-btn-menu">
                    <i class="fa fa-bars" />
                </div>
                <div
                    class={classes({
                        'list__search-field-wrap': true,
                        'list__search-field-wrap--text': !!searchText
                    })}
                >
                    <input
                        ref={input}
                        type="text"
                        class="list__search-field input-search"
                        autocomplete="off"
                        spellcheck={false}
                        value={searchText}
                        onInput={() => searchChanged(input.current.value)}
                        onFocus={inputFocused}
                        onKeyDown={inputKeyDown}
                    />
                    <div class="list__search-icon-search" onClick={toggleAdvClicked}>
                        <kw-tip text={Locale.searchAdvTitle} />
                        <i class="fa fa-search" /> <i class="fa fa-caret-down" />
                    </div>
                    <div class="list__search-icon-clear" onClick={withoutPropagation(clearClicked)}>
                        <i class="fa fa-times-circle" />
                    </div>
                </div>
                {canCreate ? (
                    <div class="list__search-btn-new">
                        <kw-tip text={Locale.searchAddNew} />
                        <i class="fa fa-plus" />
                    </div>
                ) : null}
                <div class="list__search-btn-sort">
                    <kw-tip text={Locale.searchSort} />
                    <i class="fa fa-sort-alpha-down" />
                </div>
                {showAdvanced ? (
                    <div class="list__search-adv">
                        <div class="list__search-adv-text">{Locale.searchSearchIn}:</div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-user"
                                onClick={() => advChecked('user')}
                                checked={adv?.user}
                            />
                            <label for="list__search-adv-check-user">
                                {StringFormat.capFirst(Locale.user)}
                            </label>
                        </div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-other"
                                onClick={() => advChecked('other')}
                                checked={adv?.other}
                            />
                            <label for="list__search-adv-check-other">{Locale.searchOther}</label>
                        </div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-website"
                                onClick={() => advChecked('url')}
                                checked={adv?.url}
                            />
                            <label for="list__search-adv-check-website">
                                {StringFormat.capFirst(Locale.website)}
                            </label>
                        </div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-protect"
                                onClick={() => advChecked('protect')}
                                checked={adv?.protect}
                            />
                            <label for="list__search-adv-check-protect">
                                {Locale.searchProtect}
                            </label>
                        </div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-notes"
                                onClick={() => advChecked('notes')}
                                checked={adv?.notes}
                            />
                            <label for="list__search-adv-check-notes">
                                {StringFormat.capFirst(Locale.notes)}
                            </label>
                        </div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-pass"
                                onClick={() => advChecked('pass')}
                                checked={adv?.pass}
                            />
                            <label for="list__search-adv-check-pass">
                                {StringFormat.capFirst(Locale.password)}
                            </label>
                        </div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-title"
                                onClick={() => advChecked('title')}
                                checked={adv?.title}
                            />
                            <label for="list__search-adv-check-title">
                                {StringFormat.capFirst(Locale.title)}
                            </label>
                        </div>
                        <div class="list__search-adv-text">{Locale.searchOptions}:</div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-cs"
                                onClick={() => advChecked('cs')}
                                checked={adv?.cs}
                            />
                            <label for="list__search-adv-check-cs">{Locale.searchCase}</label>
                        </div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-regex"
                                onClick={() => advChecked('regex')}
                                checked={adv?.regex}
                            />
                            <label for="list__search-adv-check-regex">{Locale.searchRegex}</label>
                        </div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-history"
                                onClick={() => advChecked('history')}
                                checked={adv?.history}
                            />
                            <label for="list__search-adv-check-history">
                                {StringFormat.capFirst(Locale.history)}
                            </label>
                        </div>
                        <div class="list__search-check">
                            <input
                                type="checkbox"
                                id="list__search-adv-check-exact"
                                onClick={() => advChecked('exact')}
                                checked={adv?.exact}
                            />
                            <label for="list__search-adv-check-exact">{Locale.searchExact}</label>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
