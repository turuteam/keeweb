import { FunctionComponent } from 'preact';
import { BackButton } from 'views/components/back-button';
import { Scrollable } from 'views/components/scrollable';
import { Locale } from 'util/locale';

export const GroupPanelView: FunctionComponent<{ backClicked: () => void }> = ({ backClicked }) => {
    return (
        <div class="grp">
            <BackButton onClick={backClicked} />
            <Scrollable>
                <div class="grp__content">
                    <h1>{Locale.grpTitle}</h1>
                </div>
            </Scrollable>
        </div>
    );
};
