import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';

export const OpenUnlockMessageView: FunctionComponent<{
    unlockMessage?: string;
}> = ({ unlockMessage }) => {
    if (!unlockMessage) {
        return null;
    }
    return (
        <div class="open__message">
            <div class="open__message-content">{unlockMessage}</div>
            <div class="open__message-cancel-btn">
                <i class="fa fa-times-circle open__message-cancel-btn-icon" />
                <kw-tip text={Locale.alertCancel} placement="left" />
            </div>
        </div>
    );
};
