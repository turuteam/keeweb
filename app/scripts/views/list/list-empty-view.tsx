import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { LocalizedWith } from 'views/components/localized-with';

export const ListEmptyView: FunctionComponent = () => {
    return (
        <div class="empty-block muted-color">
            <div class="empty-block__icon">
                <i class="fa fa-keeweb" />
            </div>
            <h1 class="empty-block__title">{Locale.listEmptyTitle}</h1>
            <p class="empty-block__text">
                <LocalizedWith str={Locale.listEmptyAdd}>
                    <i class="fa fa-plus" />
                </LocalizedWith>
            </p>
        </div>
    );
};
