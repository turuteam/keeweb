import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { AppSettingsTitlebarStyle } from 'models/app-settings';
import { Titlebar } from 'ui/titlebar';
import { Open } from 'ui/open';

export const AppView: FunctionComponent<{
    beta: boolean;
    customTitlebar: boolean;
    titlebarStyle: AppSettingsTitlebarStyle;
    listVisible: boolean;
    panelVisible: boolean;
    openVisible: boolean;
}> = ({ beta, customTitlebar, titlebarStyle, listVisible, panelVisible, openVisible }) => {
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
                        <div class="app__menu" />
                        <div class="app__menu-drag" />
                        <div class="app__list-wrap">
                            <div class="app__list" />
                            <div class="app__list-drag" />
                            <div class="app__details" />
                        </div>
                    </>
                ) : null}
                {panelVisible ? <div class="app__panel" /> : null}
                {openVisible ? <Open /> : null}
            </div>
            <div class="app__footer" />
        </div>
    );
};
