import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { AppSettingsTitlebarStyle } from 'models/app-settings';
import { Titlebar } from 'ui/titlebar';
import { OpenScreen } from 'ui/open/open-screen';
import { Footer } from 'ui/footer';
import { AppMenu } from 'ui/menu/app-menu';
import { List } from 'ui/list/list';
import { Settings } from 'ui/settings/settings';
import { DragHandle } from 'views/components/drag-handle';
import { Generator } from 'ui/generator';
import { AppContextMenuContainer } from 'ui/menu/app-context-menu-container';
import { useRef } from 'preact/hooks';
import { classes } from 'util/ui/classes';

export const AppView: FunctionComponent<{
    beta: boolean;
    customTitlebar: boolean;
    titlebarStyle: AppSettingsTitlebarStyle;
    menuVisible: boolean;
    listVisible: boolean;
    settingsVisible: boolean;
    panelVisible: boolean;
    openVisible: boolean;
    tableView: boolean;
    menuWidth: number | null;
    listWidth: number | null;
}> = ({
    beta,
    customTitlebar,
    titlebarStyle,
    menuVisible,
    listVisible,
    settingsVisible,
    panelVisible,
    openVisible,
    tableView,
    menuWidth,
    listWidth
}) => {
    const appMenu = useRef<HTMLDivElement>();
    const appList = useRef<HTMLDivElement>();

    return (
        <div class="app">
            {beta ? (
                <div class="app__beta">
                    <i class="fa fa-exclamation-triangle" /> {Locale.appBeta}
                </div>
            ) : null}
            {customTitlebar ? (
                <Titlebar />
            ) : titlebarStyle === 'hidden' ? (
                <div class="app__titlebar-drag" />
            ) : null}
            <div class="app__body">
                {menuVisible ? (
                    <>
                        <div class="app__menu" ref={appMenu} style={{ width: menuWidth }}>
                            <AppMenu />
                        </div>
                        <div class="app__menu-drag">
                            <DragHandle
                                target={appMenu}
                                coord="x"
                                name="menu"
                                min={130}
                                max={300}
                            />
                        </div>
                    </>
                ) : null}
                {listVisible ? (
                    <div
                        class={classes({
                            'app__list-wrap': true,
                            'app__list-wrap--table': tableView
                        })}
                    >
                        <div class="app__list" ref={appList} style={{ width: listWidth }}>
                            <List />
                        </div>
                        <div class="app__list-drag">
                            <DragHandle
                                target={appList}
                                coord="x"
                                name="list"
                                min={200}
                                max={500}
                            />
                        </div>
                        <div class="app__details" />
                    </div>
                ) : null}
                {panelVisible ? <div class="app__panel" /> : null}
                {settingsVisible ? <Settings /> : null}
                {openVisible ? <OpenScreen /> : null}
            </div>
            <div class="app__footer">
                <Footer />
            </div>
            <Generator />
            <AppContextMenuContainer />
        </div>
    );
};
