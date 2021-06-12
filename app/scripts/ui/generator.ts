import { FunctionComponent, h } from 'preact';
import { useAppSetting, useKey, useModelField, useModelWatcher } from 'util/ui/hooks';
import { GeneratorState } from 'models/generator-state';
import { GeneratorView } from 'views/generator-view';
import { GeneratorPresets } from 'comp/app/generator-presets';
import { Locale } from 'util/locale';
import { PasswordPresenter } from 'util/formatting/password-presenter';
import { PasswordGenerator, PasswordGeneratorOptions } from 'util/generators/password-generator';
import { PropertiesOfType } from 'util/types';
import { AppSettings } from 'models/app-settings';
import { CopyPaste } from 'comp/browser/copy-paste';
import { Launcher } from 'comp/launcher';
import { Keys } from 'const/keys';
import { DropdownState } from 'models/dropdown-state';

const PseudoValues = [
    3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 32, 48, 64
];

function lengthToPseudoValue(length: number): number {
    for (let ix = 0; ix < PseudoValues.length; ix++) {
        if (PseudoValues[ix] >= length) {
            return ix;
        }
    }
    return PseudoValues.length - 1;
}

export const GeneratorContainer: FunctionComponent = () => {
    const dropdownType = useModelField(DropdownState, 'type');

    if (dropdownType !== 'generator') {
        return null;
    }

    return h(Generator, null);
};

export const Generator: FunctionComponent = () => {
    useModelWatcher(GeneratorState);

    const generatorHidePassword = useAppSetting('generatorHidePassword');

    useKey(Keys.DOM_VK_ESCAPE, () => GeneratorState.hide());

    const presets = GeneratorPresets.enabled;
    const opt =
        GeneratorState.selectedPreset ??
        GeneratorState.opt ??
        presets.find((ps) => ps.default) ??
        GeneratorPresets.defaultPreset;

    const canCopy = document.queryCommandSupported('copy');
    const btnTitle = GeneratorState.copyResult
        ? canCopy
            ? Locale.alertCopy
            : Locale.alertClose
        : Locale.alertOk;

    const hidePassword = GeneratorState.showToggleButton && generatorHidePassword;

    if (!GeneratorState.password) {
        GeneratorState.password = PasswordGenerator.generate(opt);
    }

    const password = GeneratorState.password;
    const displayedPassword = hidePassword ? PasswordPresenter.present(password.length) : password;

    const refreshClicked = () => {
        GeneratorState.password = PasswordGenerator.generate(opt);
    };

    const lengthChanged = (pseudoLength: number) => {
        const length = PseudoValues[pseudoLength];
        if (length && length !== opt.length) {
            GeneratorState.opt = { ...opt, length };
            GeneratorState.selectedPreset = undefined;
            GeneratorState.password = PasswordGenerator.generate(GeneratorState.opt);
        }
    };

    const optionChanged = (
        prop: PropertiesOfType<PasswordGeneratorOptions, boolean | undefined>
    ) => {
        const newOpt = { ...opt, [prop]: !opt[prop] };
        if (newOpt.name !== 'Pronounceable' || (prop !== 'upper' && prop !== 'lower')) {
            delete newOpt.name;
        }
        GeneratorState.opt = newOpt;
        GeneratorState.selectedPreset = undefined;
        GeneratorState.password = PasswordGenerator.generate(GeneratorState.opt);
    };

    const presetSelected = (presetName: string) => {
        const preset =
            presetName === GeneratorState.derivedPreset?.name
                ? GeneratorState.derivedPreset
                : presets.find((ps) => ps.name === presetName);
        if (!preset) {
            return;
        }
        GeneratorState.opt = preset;
        GeneratorState.selectedPreset = preset;
        GeneratorState.password = PasswordGenerator.generate(GeneratorState.opt);
    };

    const hideChanged = () => {
        AppSettings.generatorHidePassword = !AppSettings.generatorHidePassword;
    };

    const okClicked = () => {
        if (GeneratorState.copyResult) {
            if (!Launcher) {
                CopyPaste.createHiddenInput(GeneratorState.password);
            }
            CopyPaste.copy(GeneratorState.password);
        }
        GeneratorState.hide();
    };

    return h(GeneratorView, {
        pos: GeneratorState.pos,
        opt,
        pseudoLength: lengthToPseudoValue(opt.length),
        showToggleButton: GeneratorState.showToggleButton,
        hidePassword,
        presets,
        derivedPreset: GeneratorState.derivedPreset,
        showPresetEditor: GeneratorState.showPresetEditor,
        btnTitle,
        password: displayedPassword,

        refreshClicked,
        lengthChanged,
        optionChanged,
        hideChanged,
        presetSelected,
        okClicked
    });
};
