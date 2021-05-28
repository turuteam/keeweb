import { h, FunctionComponent } from 'preact';
import { OpenUnlockMessageView } from 'views/open/open-unlock-message-view';
import { useModelField } from 'util/ui/hooks';
import { Workspace } from 'models/workspace';

export const OpenUnlockMessage: FunctionComponent = () => {
    const unlockMessage = useModelField(Workspace, 'unlockMessage');

    return h(OpenUnlockMessageView, {
        unlockMessage
    });
};
