import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';

export const BackButton: FunctionComponent<{ onClick: () => void }> = ({ onClick }) => {
    return (
        <div class="back-button" onClick={onClick}>
            {Locale.retToApp} <i class="fa fa-arrow-circle-left back-button__post" />
        </div>
    );
};
