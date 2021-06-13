import { FunctionComponent } from 'preact';
import { BackButton } from 'views/components/back-button';
import { Locale } from 'util/locale';
import { StringFormat } from 'util/formatting/string-format';
import { useRef } from 'preact/hooks';

export const TagPanelView: FunctionComponent<{
    title: string;

    backClicked: () => void;
    titleChanged: (value: string) => void;
    renameClicked: () => void;
    trashClicked: () => void;
}> = ({
    title,

    backClicked,
    titleChanged,
    renameClicked,
    trashClicked
}) => {
    const titleInput = useRef<HTMLInputElement>();

    return (
        <div class="tag">
            <BackButton onClick={backClicked} />
            <h1>{Locale.tagTitle}</h1>
            <div class="tag__field">
                <label for="tag__field-title">{StringFormat.capFirst(Locale.name)}:</label>
                <input
                    type="text"
                    class="input-base"
                    id="tag__field-title"
                    ref={titleInput}
                    value={title}
                    onInput={() => titleChanged(titleInput.current.value)}
                    size={50}
                    maxLength={128}
                    required
                />
                <button class="tag__btn-rename" onClick={renameClicked}>
                    {Locale.tagRename}
                </button>
            </div>
            <div class="tag__space" />
            <div class="tag__buttons">
                <i class="tag__buttons-trash fa fa-trash-alt" onClick={trashClicked}>
                    <kw-tip text={Locale.tagTrash} placement="right" />
                </i>
            </div>
        </div>
    );
};
