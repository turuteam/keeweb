import { FunctionComponent, h } from 'preact';
import { GroupPanelView } from 'views/panel/group-panel-view';
import { Workspace } from 'models/workspace';
import { Group } from 'models/group';
import { useModelWatcher } from 'util/ui/hooks';
import { Launcher } from 'comp/launcher';
import { useState } from 'preact/hooks';

export const GroupPanel: FunctionComponent = () => {
    const group = Workspace.menu.selectedItem as Group;

    useModelWatcher(group);

    const [title, setTitle] = useState(group.title ?? '');
    const [autoTypeSeq, setAutoTypeSeq] = useState(group.autoTypeSeq ?? '');
    const [autoTypeSeqInvalid, setAutoTypeSeqInvalid] = useState(false);
    const [iconSelectVisible, setIconSelectVisible] = useState(false);

    const backClicked = () => Workspace.showList();

    const titleChanged = (value: string) => {
        setTitle(value);
        value = value.trim();
        if (value && !group.top && value !== group.title) {
            group.setName(value);
        }
    };

    const enableSearchingChanged = () => {
        group.setEnableSearching(!group.getEffectiveEnableSearching());
    };

    const autoTypeEnabledChanged = () => {
        group.setEnableAutoType(!group.getEffectiveEnableAutoType());
    };

    const autoTypeSeqChanged = (value: string) => {
        setAutoTypeSeq(value);

        value = value.trim();

        // TODO: AutoType.validate
        setAutoTypeSeqInvalid(false);
        group.setAutoTypeSeq(value);
    };

    const trashClicked = () => {
        group.moveToTrash();
        Workspace.selectAllAndShowList();
    };

    const iconClicked = () => {
        setIconSelectVisible(!iconSelectVisible);
    };

    const iconSelected = (iconId: number) => {
        group.setIcon(iconId);
        setIconSelectVisible(false);
    };

    const customIconSelected = (id: string) => {
        group.setCustomIcon(id);
        setIconSelectVisible(false);
    };

    return h(GroupPanelView, {
        file: group.file,
        title,
        readOnly: group.top,
        enableSearching: group.getEffectiveEnableSearching(),
        icon: group.icon ?? 'folder',
        iconId: group.iconId,
        customIcon: group.customIcon,
        customIconId: group.customIconId,
        canAutoType: !!Launcher,
        autoTypeEnabled: group.getEffectiveEnableAutoType(),
        autoTypeSeq,
        autoTypeSeqInvalid,
        defaultAutoTypeSeq: group.getParentEffectiveAutoTypeSeq(),
        iconSelectVisible,

        backClicked,
        titleChanged,
        enableSearchingChanged,
        autoTypeEnabledChanged,
        autoTypeSeqChanged,
        trashClicked,
        iconClicked,
        iconSelected,
        customIconSelected
    });
};
