import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { AppSettingsTitlebarStyle } from 'models/app-settings';

export const AppView: FunctionComponent<{
    beta: boolean;
    customTitlebar: boolean;
    titlebarStyle: AppSettingsTitlebarStyle;
}> = ({ beta, customTitlebar, titlebarStyle }) => {
    return (
        <div class="app">
            {beta ? (
                <div class="app__beta">
                    <i class="fa fa-exclamation-triangle" /> {Locale.appBeta}
                </div>
            ) : null}
            {customTitlebar ? (
                <div class="app__titlebar" />
            ) : titlebarStyle === 'hidden' ? (
                <div class="app__titlebar-drag" />
            ) : null}
            <div class="app__body">
                <div class="app__menu" />
                <div class="app__menu-drag" />
                <div class="app__list-wrap">
                    <div class="app__list" />
                    <div class="app__list-drag" />
                    <div class="app__details" />
                </div>
                <div class="app__panel hide" />
            </div>
            <div class="app__footer" />
        </div>
    );
};
