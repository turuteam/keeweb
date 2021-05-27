import { FunctionComponent, h } from 'preact';
import { Workspace } from 'models/workspace';
import { AppMenuView } from 'views/menu/app-menu-view';
import { useEffect, useState } from 'preact/hooks';

export const AppMenu: FunctionComponent = () => {
    const [sections, setSections] = useState(Workspace.menu.sections);

    useEffect(() => {
        Workspace.menu.onChange('sections', setSections);
        return () => Workspace.menu.offChange('sections', setSections);
    }, []);

    return h(AppMenuView, {
        sections
    });
};
