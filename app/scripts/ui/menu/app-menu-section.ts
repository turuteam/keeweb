import { FunctionComponent, h } from 'preact';
import { AppMenuSectionView } from 'views/menu/app-menu-section-view';
import { MenuSection } from 'models/menu/menu-section';
import { useEffect, useState } from 'preact/hooks';
import { Events } from 'util/events';
import { AppSettings } from 'models/app-settings';

export const AppMenuSection: FunctionComponent<{ section: MenuSection }> = ({ section }) => {
    const [, refresh] = useState({});

    useEffect(() => {
        const onChange = () => refresh({});
        section.on('change', onChange);
        return () => section.off('change', onChange);
    }, []);

    useEffect(() => {
        if (section.drag) {
            const dragHandleSet = (name: string, size: number | null) => {
                if (name === `menu-section:${section.id}`) {
                    AppSettings.tagsViewHeight = size;
                }
            };
            Events.on('drag-handle-set', dragHandleSet);
            return () => Events.off('drag-handle-set', dragHandleSet);
        }
    }, [section.drag]);

    return h(AppMenuSectionView, {
        id: section.id,
        scrollable: section.scrollable,
        grow: section.grow,
        drag: section.drag,
        items: section.items,
        height: section.height
    });
};
