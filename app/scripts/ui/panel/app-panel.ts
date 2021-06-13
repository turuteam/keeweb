import { FunctionComponent, h } from 'preact';
import { useModelField } from 'util/ui/hooks';
import { Workspace } from 'models/workspace';
import { GeneratorPresetsPanel } from 'ui/panel/generator-presets-panel';
import { GroupPanel } from 'ui/panel/group-panel';
import { TagPanel } from 'ui/panel/tag-panel';

export const AppPanel: FunctionComponent = () => {
    const panel = useModelField(Workspace, 'panel');
    if (!panel) {
        return null;
    }

    switch (panel) {
        case 'generator-presets':
            return h(GeneratorPresetsPanel, null);
        case 'group':
            return h(GroupPanel, null);
        case 'tag':
            return h(TagPanel, null);
    }
};
