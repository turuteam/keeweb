import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { AppSettingsTitlebarStyle } from 'models/app-settings';
import { Titlebar } from 'ui/titlebar';
import { Open } from 'ui/open';
import { Footer } from 'ui/footer';
import { AppMenu } from 'ui/menu/app-menu';
import { DragHandle } from 'views/components/drag-handle';
import { useRef } from 'preact/hooks';
import { classes } from 'util/ui/classes';

export const AppView: FunctionComponent<{
    beta: boolean;
    customTitlebar: boolean;
    titlebarStyle: AppSettingsTitlebarStyle;
    listVisible: boolean;
    panelVisible: boolean;
    openVisible: boolean;
    tableView: boolean;
    menuWidth: number | null;
    listWidth: number | null;
}> = ({
    beta,
    customTitlebar,
    titlebarStyle,
    listVisible,
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
                {listVisible ? (
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
                        <div
                            class={classes({
                                'app__list-wrap': true,
                                'app__list-wrap--table': tableView
                            })}
                        >
                            <div class="app__list" ref={appList} style={{ width: listWidth }} />
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
                    </>
                ) : null}
                {panelVisible ? <div class="app__panel" /> : null}
                {openVisible ? <Open /> : null}
            </div>
            <div class="app__footer">
                <Footer />
            </div>
        </div>
    );
};
