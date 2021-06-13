import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { Scrollable } from 'views/components/scrollable';
import { BackButton } from 'views/components/back-button';
import { PasswordGeneratorPreset } from 'util/generators/password-generator';
import { StringFormat } from 'util/formatting/string-format';
import { classes } from 'util/ui/classes';

export interface GeneratorPresetsRange {
    name: string;
    title: string;
    enabled: boolean;
    sample: string;
}

export const GeneratorPresetsPanelView: FunctionComponent<{
    presets: PasswordGeneratorPreset[];
    selected: PasswordGeneratorPreset;
    ranges: GeneratorPresetsRange[];
    example: string;
    showPatternHelp: boolean;

    title: string;
    titleInvalid: boolean;
    length: string;
    lengthInvalid: boolean;

    backClicked: () => void;
    selectedChanged: (name: string) => void;
    isEnabledChanged: () => void;
    isDefaultChanged: () => void;
    titleChanged: (value: string) => void;
    lengthChanged: (value: string) => void;
    rangeEnabledChanged: (range: string) => void;
    includeChanged: (value: string) => void;
    patternChanged: (value: string) => void;
    togglePatternHelpClicked: () => void;
    createClicked: () => void;
    deleteClicked: () => void;
}> = ({
    presets,
    selected,
    ranges,
    example,
    showPatternHelp,

    title,
    titleInvalid,
    length,
    lengthInvalid,

    backClicked,
    selectedChanged,
    isEnabledChanged,
    isDefaultChanged,
    titleChanged,
    lengthChanged,
    rangeEnabledChanged,
    includeChanged,
    patternChanged,
    togglePatternHelpClicked,
    createClicked,
    deleteClicked
}) => {
    return (
        <div class="gen-ps">
            <BackButton onClick={backClicked} />
            <Scrollable>
                <div class="gen-ps__content">
                    <h1>{Locale.genPsTitle}</h1>
                    <select
                        class="gen-ps__list input-base"
                        value={selected.name}
                        onChange={(e) => selectedChanged((e.target as HTMLSelectElement).value)}
                    >
                        {presets.map((ps) => (
                            <option key={ps.name} value={ps.name}>
                                {ps.builtIn ? '* ' : ''}
                                {ps.title}
                            </option>
                        ))}
                    </select>
                    <div class="gen-ps__field">
                        <input
                            type="checkbox"
                            class="input-base"
                            id="gen-ps__check-enabled"
                            checked={!selected.disabled}
                            onClick={() => isEnabledChanged()}
                        />
                        <label for="gen-ps__check-enabled">{Locale.genPsEnabled}</label>
                    </div>
                    <div class="gen-ps__field">
                        <input
                            type="checkbox"
                            class="input-base"
                            id="gen-ps__check-default"
                            checked={!!selected.default}
                            onClick={() => isDefaultChanged()}
                        />
                        <label for="gen-ps__check-default">{Locale.genPsDefault}</label>
                    </div>
                    <div class="gen-ps__field">
                        <label for="gen-ps__field-title">
                            {StringFormat.capFirst(Locale.name)}:
                        </label>
                        <input
                            type="text"
                            class={classes({
                                'input-base': true,
                                'input--error': titleInvalid
                            })}
                            id="gen-ps__field-title"
                            value={title}
                            onInput={(e) => titleChanged((e.target as HTMLInputElement).value)}
                            size={50}
                            maxLength={64}
                            required
                            readonly={selected.builtIn}
                        />
                    </div>
                    <div class="gen-ps__field">
                        <label for="gen-ps__field-length">{Locale.genPsDefaultLength}:</label>
                        <input
                            type="text"
                            class={classes({
                                'input-base': true,
                                'input--error': lengthInvalid
                            })}
                            id="gen-ps__field-length"
                            value={length}
                            onInput={(e) => lengthChanged((e.target as HTMLInputElement).value)}
                            size={50}
                            maxLength={3}
                            required
                            pattern="\d+"
                            readonly={selected.builtIn}
                        />
                    </div>
                    {ranges.map((range) => (
                        <div class="gen-ps__field" key={range.name}>
                            <input
                                type="checkbox"
                                class="input-base gen-ps__check-range"
                                id={`gen-ps__check-${range.name}`}
                                checked={range.enabled}
                                onClick={() => rangeEnabledChanged(range.name)}
                                disabled={selected.builtIn}
                            />
                            <label for={`gen-ps__check-${range.name}`}>
                                {range.title}
                                <span class="gen-ps__sample"> {range.sample}</span>
                            </label>
                        </div>
                    ))}
                    <div class="gen-ps__field">
                        <label for="gen-ps__field-include">{Locale.genPsInclude}:</label>
                        <input
                            type="text"
                            class="input-base"
                            id="gen-ps__field-include"
                            value={selected.include}
                            onInput={(e) => includeChanged((e.target as HTMLInputElement).value)}
                            readonly={selected.builtIn}
                        />
                    </div>
                    <div class="gen-ps__field">
                        <label for="gen-ps__field-pattern">
                            {Locale.genPsPattern}:{' '}
                            <i
                                class="fa fa-info-circle info-btn info-btn--pattern"
                                onClick={togglePatternHelpClicked}
                            />
                        </label>
                        {showPatternHelp ? (
                            <div class="gen-ps__pattern-help">
                                <p>{Locale.genPsPatternHelp}</p>
                                <p>
                                    <code>X</code> – {Locale.genPsAllRanges}
                                    <br />
                                    <code>A</code> – {Locale.genPsUpper}
                                    <br />
                                    <code>a</code> – {Locale.genPsLower}
                                    <br />
                                    <code>1</code> – {Locale.genPsDigits}
                                    <br />
                                    <code>*</code> – {Locale.genPsSpecial}
                                    <br />
                                    <code>[</code> – {Locale.genPsBrackets}
                                    <br />
                                    <code>Ä</code> – {Locale.genPsHigh}
                                    <br />
                                    <code>0</code> – {Locale.genPsAmbiguous}
                                    <br />
                                    <code>I</code> – {Locale.genPsIncluded}
                                </p>
                            </div>
                        ) : null}
                        <input
                            type="text"
                            class="input-base"
                            id="gen-ps__field-pattern"
                            value={selected.pattern}
                            onInput={(e) => patternChanged((e.target as HTMLInputElement).value)}
                            readonly={selected.builtIn}
                        />
                    </div>
                    <div class="gen-ps__field">
                        <label>{Locale.genPsExample}:</label>
                        <div class="gen-ps__example">{example}</div>
                    </div>
                </div>
            </Scrollable>
            <div class="gen-ps__buttons">
                <button class="gen-ps__btn-create" onClick={createClicked}>
                    {Locale.genPsCreate}
                </button>
                {selected.builtIn ? null : (
                    <button class="gen-ps__btn-delete btn-error" onClick={deleteClicked}>
                        {Locale.genPsDelete}
                    </button>
                )}
            </div>
        </div>
    );
};
