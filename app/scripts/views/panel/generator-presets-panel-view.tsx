import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { Scrollable } from 'views/components/scrollable';
import { BackButton } from 'views/components/back-button';

export const GeneratorPresetsPanelView: FunctionComponent<{ backClicked: () => void }> = ({
    backClicked
}) => {
    return (
        <div class="gen-ps">
            <BackButton onClick={backClicked} />
            <Scrollable>
                <div class="gen-ps__content">
                    <h1>{Locale.genPsTitle}</h1>
                </div>
            </Scrollable>
        </div>
    );
};
