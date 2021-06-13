import { FunctionComponent, h, render } from 'preact';
import { GeneratorPresetsPanelView } from 'views/panel/generator-presets-panel-view';
import { Workspace } from 'models/workspace';
import { GeneratorPresets } from 'comp/app/generator-presets';
import { useMemo, useState } from 'preact/hooks';
import {
    CharRange,
    CharRanges,
    PasswordGenerator,
    PasswordGeneratorPreset
} from 'util/generators/password-generator';
import { Locale } from 'util/locale';
import { StringFormat } from 'util/formatting/string-format';

export const GeneratorPresetsPanel: FunctionComponent = () => {
    const backClicked = () => Workspace.showList();

    const presets = GeneratorPresets.all;

    const [, setRefreshState] = useState({});
    const refresh = () => setRefreshState({});
    const [showPatternHelp, setShowPatternHelp] = useState(false);
    const [selectedName, setSelectedName] = useState(
        (presets.find((p) => p.default) ?? presets[0]).name
    );
    const selected = presets.find((p) => p.name === selectedName) ?? presets[0];

    const [title, setTitle] = useState(selected.title);
    const [titleInvalid, setTitleInvalid] = useState(false);

    const [length, setLength] = useState(selected.length.toString());
    const [lengthInvalid, setLengthInvalid] = useState(false);

    const changeSelected = (name: string) => {
        const selected = GeneratorPresets.all.find((p) => p.name === name) ?? presets[0];

        setSelectedName(name);

        setTitle(selected.title);
        setTitleInvalid(false);

        setLength(selected.length.toString());
        setLengthInvalid(false);
    };

    const selectedParams: Record<string, unknown> = { ...selected };
    delete selectedParams.name;
    delete selectedParams.title;
    delete selectedParams.default;
    delete selectedParams.disabled;
    const selectedParamsStr = JSON.stringify(selectedParams);

    const ranges = useMemo(() => {
        const rangeOverride: Record<string, string> = {
            high: '¡¢£¤¥¦§©ª«¬®¯°±¹²´µ¶»¼÷¿ÀÖîü...'
        };
        return Object.keys(CharRanges).map((key) => {
            const range = key as CharRange;
            return {
                name: range,
                title: Locale.get(`genPs${StringFormat.capFirst(range)}`) ?? '',
                enabled: !!selected[range],
                sample: rangeOverride[range] || CharRanges[range]
            };
        });
    }, [selectedParamsStr]);
    const example = useMemo(() => PasswordGenerator.generate(selected), [selectedParamsStr]);

    const selectedChanged = (name: string) => {
        const found = presets.find((p) => p.name === name);
        if (found) {
            changeSelected(found.name);
        }
    };

    const isEnabledChanged = () => {
        GeneratorPresets.setDisabled(selected.name, !selected.disabled);
        if (selected.default) {
            GeneratorPresets.setDefault(null);
        }
        refresh();
    };

    const isDefaultChanged = () => {
        if (selected.default) {
            GeneratorPresets.setDefault(null);
        } else {
            if (selected.disabled) {
                GeneratorPresets.setDisabled(selected.name, false);
            }
            GeneratorPresets.setDefault(selected.name);
        }
        refresh();
    };

    const titleChanged = (value: string) => {
        setTitle(value);
        if (value && value !== selected.title) {
            let duplicate = presets.some((p) => p.title.toLowerCase() === value.toLowerCase());
            if (!duplicate) {
                const reservedTitles = [Locale.genPresetDerived];
                duplicate = reservedTitles.includes(value.toLowerCase());
            }
            if (duplicate) {
                setTitleInvalid(true);
                return;
            } else {
                setTitleInvalid(false);
            }
            GeneratorPresets.setPreset(selected.name, { title: value });
            refresh();
        }
    };

    const lengthChanged = (value: string) => {
        setLength(value);
        const length = +value;
        if (length > 0) {
            GeneratorPresets.setPreset(selected.name, { length });
            setLengthInvalid(false);
        } else {
            setLengthInvalid(true);
        }
    };

    const rangeEnabledChanged = (rangeStr: string) => {
        const range = rangeStr as CharRange;
        const enabled = !selected[range];
        GeneratorPresets.setPreset(selected.name, { [range]: enabled });
        refresh();
    };

    const includeChanged = (value: string) => {
        GeneratorPresets.setPreset(selected.name, { include: value });
        refresh();
    };

    const patternChanged = (value: string) => {
        GeneratorPresets.setPreset(selected.name, { pattern: value });
        refresh();
    };

    const togglePatternHelpClicked = () => {
        setShowPatternHelp(!showPatternHelp);
    };

    const createClicked = () => {
        let name;
        let title;
        for (let i = 1; ; i++) {
            const newName = `Custom${i}`;
            const newTitle = `${Locale.genPsNew} ${i}`;
            if (!presets.filter((p) => p.name === newName || p.title === newTitle).length) {
                name = newName;
                title = newTitle;
                break;
            }
        }
        const preset: PasswordGeneratorPreset = {
            name,
            title,
            length: selected.length,
            upper: selected.upper,
            lower: selected.lower,
            digits: selected.digits,
            special: selected.special,
            brackets: selected.brackets,
            ambiguous: selected.ambiguous,
            include: selected.include
        };
        GeneratorPresets.add(preset);
        changeSelected(name);
    };

    const deleteClicked = () => {
        if (!selected.builtIn) {
            GeneratorPresets.remove(selected.name);
        }
        changeSelected(presets[0].name);
    };

    return h(GeneratorPresetsPanelView, {
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
    });
};
