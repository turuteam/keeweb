import { FunctionComponent, h } from 'preact';
import { GeneratorPresetsPanelView } from 'views/panel/generator-presets-panel-view';
import { Workspace } from 'models/workspace';

export const GeneratorPresetsPanel: FunctionComponent = () => {
    const backClicked = () => Workspace.showList();

    return h(GeneratorPresetsPanelView, {
        backClicked
    });
};
