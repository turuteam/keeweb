import { FunctionComponent, h } from 'preact';
import { AppMenuSectionView } from 'views/menu/app-menu-section-view';
import { MenuSection } from 'models/menu/menu-section';
import { useEffect, useState } from 'preact/hooks';

export const AppMenuSection: FunctionComponent<{ section: MenuSection }> = ({ section }) => {
    const [, refresh] = useState({});

    useEffect(() => {
        const onChange = () => refresh({});
        section.on('change', onChange);
        return () => section.off('change', onChange);
    }, []);

    return h(AppMenuSectionView, {
        scrollable: section.scrollable,
        grow: section.grow,
        drag: section.drag,
        items: section.items
    });
};
