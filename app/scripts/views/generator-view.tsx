import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import {
    PasswordGeneratorOptions,
    PasswordGeneratorPreset
} from 'util/generators/password-generator';
import { Position, PropertiesOfType } from 'util/types';
import { classes } from 'util/ui/classes';
import { useRef } from 'preact/hooks';
import { usePositionable } from 'util/ui/hooks';
import { withoutPropagation } from 'util/ui/events';

export const GeneratorView: FunctionComponent<{
    pos: Position;
    opt: PasswordGeneratorOptions;
    pseudoLength: number;
    showToggleButton: boolean;
    hidePassword: boolean;
    presets: PasswordGeneratorPreset[];
    derivedPreset?: PasswordGeneratorOptions;
    showPresetEditor: boolean;
    btnTitle: string;
    password: string;

    refreshClicked: () => void;
    lengthChanged: (length: number) => void;
    optionChanged: (prop: PropertiesOfType<PasswordGeneratorOptions, boolean | undefined>) => void;
    hideChanged: () => void;
    presetSelected: (preset: string) => void;
    okClicked: () => void;
}> = ({
    pos,
    opt,
    pseudoLength,
    showToggleButton,
    hidePassword,
    presets,
    derivedPreset,
    showPresetEditor,
    btnTitle,
    password,

    refreshClicked,
    lengthChanged,
    optionChanged,
    hideChanged,
    presetSelected,
    okClicked
}) => {
    const el = useRef<HTMLDivElement>();
    const rangeInput = useRef<HTMLInputElement>();
    const presetSelect = useRef<HTMLSelectElement>();

    const position = usePositionable(pos, el);

    return (
        <div
            class="gen"
            style={position}
            onClick={withoutPropagation()}
            onMouseUp={withoutPropagation()}
            ref={el}
        >
            <div>
                {Locale.genLen}: <span class="gen__length-range-val">{opt.length}</span>
                <i class="fa fa-sync-alt gen__btn-refresh gen__top-btn" onClick={refreshClicked}>
                    <kw-tip text={Locale.genNewPass} />
                </i>
                {showToggleButton ? (
                    <>
                        <input
                            type="checkbox"
                            id="gen__check-hide"
                            class="gen__check-hide"
                            checked={hidePassword}
                            onClick={hideChanged}
                        />
                        <label for="gen__check-hide" class="fa gen__top-btn gen__check-hide-label">
                            <kw-tip text={hidePassword ? Locale.genHidePass : Locale.genShowPass} />
                        </label>
                    </>
                ) : null}
            </div>
            <select
                class="gen__sel-tpl input-base"
                ref={presetSelect}
                value={opt.name || 'Custom'}
                onChange={() => presetSelected(presetSelect.current.value)}
            >
                {derivedPreset ? (
                    <option key={derivedPreset.name} value={derivedPreset.name}>
                        {Locale.genPresetDerived}
                    </option>
                ) : null}
                {presets.map((ps) => (
                    <option key={ps.name} value={ps.name} selected={ps.name === opt.name}>
                        {ps.title}
                    </option>
                ))}
                {showPresetEditor ? (
                    <option key="..." value="...">
                        ...
                    </option>
                ) : null}
            </select>
            <input
                type="range"
                class="gen__length-range"
                value={pseudoLength}
                min="0"
                max="25"
                ref={rangeInput}
                onMouseDown={refreshClicked}
                onInput={() => lengthChanged(+rangeInput.current?.value)}
                onChange={() => lengthChanged(+rangeInput.current?.value)}
            />
            <div>
                <div class="gen__check">
                    <input
                        type="checkbox"
                        id="gen__check-upper"
                        checked={!!opt.upper}
                        onClick={() => optionChanged('upper')}
                    />
                    <label for="gen__check-upper">ABC</label>
                </div>
                <div class="gen__check">
                    <input
                        type="checkbox"
                        id="gen__check-lower"
                        checked={!!opt.lower}
                        onClick={() => optionChanged('lower')}
                    />
                    <label for="gen__check-lower">abc</label>
                </div>
                <div class="gen__check">
                    <input
                        type="checkbox"
                        id="gen__check-digits"
                        checked={!!opt.digits}
                        onClick={() => optionChanged('digits')}
                    />
                    <label for="gen__check-digits">123</label>
                </div>
                <div class="gen__check">
                    <input
                        type="checkbox"
                        id="gen__check-special"
                        checked={!!opt.special}
                        onClick={() => optionChanged('special')}
                    />
                    <label for="gen__check-special">!@#</label>
                </div>
                <div class="gen__check">
                    <input
                        type="checkbox"
                        id="gen__check-brackets"
                        checked={!!opt.brackets}
                        onClick={() => optionChanged('brackets')}
                    />
                    <label for="gen__check-brackets">({'{'}&lt;</label>
                </div>
                <div class="gen__check">
                    <input
                        type="checkbox"
                        id="gen__check-high"
                        checked={!!opt.high}
                        onClick={() => optionChanged('high')}
                    />
                    <label for="gen__check-high">äæ±</label>
                </div>
                <div class="gen__check">
                    <input
                        type="checkbox"
                        id="gen__check-ambiguous"
                        checked={!!opt.ambiguous}
                        onClick={() => optionChanged('ambiguous')}
                    />
                    <label for="gen__check-ambiguous">0Oo</label>
                </div>
            </div>
            <div
                class={classes({
                    'gen__result': true,
                    'gen__result--long-pass': password.length > 32
                })}
            >
                {password}
            </div>
            <div class="gen__btn-wrap">
                <button class="gen__btn-ok" onClick={okClicked}>
                    {btnTitle}
                </button>
            </div>
        </div>
    );
};
