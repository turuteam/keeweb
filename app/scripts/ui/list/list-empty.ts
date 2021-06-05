import { FunctionComponent, h } from 'preact';
import { ListEmptyView } from 'views/list/list-empty-view';

export const ListEmpty: FunctionComponent = () => {
    return h(ListEmptyView, {});
};
