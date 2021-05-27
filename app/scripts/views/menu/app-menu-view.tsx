import { FunctionComponent } from 'preact';
import { MenuSection } from 'models/menu/menu-section';
import { AppMenuSection } from 'ui/menu/app-menu-section';

export const AppMenuView: FunctionComponent<{ sections: MenuSection[] }> = ({ sections }) => {
    return (
        <div class="menu">
            {sections.map((section) => (
                <AppMenuSection section={section} key={section.id} />
            ))}
        </div>
    );
};
