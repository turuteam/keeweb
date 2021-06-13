import { FunctionComponent, h } from 'preact';
import { useKey, useModelField } from 'util/ui/hooks';
import { Workspace } from 'models/workspace';
import { GeneratorPresetsPanel } from 'ui/panel/generator-presets-panel';
import { GroupPanel } from 'ui/panel/group-panel';
import { TagPanel } from 'ui/panel/tag-panel';
import { Keys } from 'const/keys';

export const AppPanel: FunctionComponent = () => {
    const panel = useModelField(Workspace, 'panel');

    useKey(Keys.DOM_VK_ESCAPE, () => Workspace.showList());

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
