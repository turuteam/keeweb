import { FunctionComponent } from 'preact';
import { BackButton } from 'views/components/back-button';
import { Scrollable } from 'views/components/scrollable';
import { Locale } from 'util/locale';
import { Logger } from 'util/logger';
import { StringFormat } from 'util/formatting/string-format';
import { AutoTypeHint } from 'ui/auto-type/auto-type-hint';
import { classes } from 'util/ui/classes';
import { useRef } from 'preact/hooks';

export const GroupPanelView: FunctionComponent<{
    title: string;
    readOnly: boolean;
    enableSearching: boolean;
    icon: string;
    customIcon?: string;
    canAutoType: boolean;
    autoTypeEnabled: boolean;
    autoTypeSeq: string;
    autoTypeSeqInvalid: boolean;
    defaultAutoTypeSeq: string;

    backClicked: () => void;
    titleChanged: (value: string) => void;
    enableSearchingChanged: () => void;
    autoTypeEnabledChanged: () => void;
    autoTypeSeqChanged: (value: string) => void;
    trashClicked: () => void;
}> = ({
    title,
    readOnly,
    enableSearching,
    icon,
    customIcon,
    canAutoType,
    autoTypeEnabled,
    autoTypeSeq,
    autoTypeSeqInvalid,
    defaultAutoTypeSeq,

    backClicked,
    titleChanged,
    enableSearchingChanged,
    autoTypeEnabledChanged,
    autoTypeSeqChanged,
    trashClicked
}) => {
    return (
        <div class="grp">
            <BackButton onClick={backClicked} />
            <Scrollable>
                <div class="grp__content">
                    <h1>{Locale.grpTitle}</h1>
                    <div class="grp__field">
                        <label for="grp__field-title">{StringFormat.capFirst(Logger.name)}:</label>
                        <input
                            type="text"
                            class="input-base"
                            id="grp__field-title"
                            value={title}
                            onInput={(e) => titleChanged((e.target as HTMLInputElement).value)}
                            size={50}
                            maxLength={1024}
                            required
                            readonly={readOnly}
                            autofocus={!title}
                        />
                    </div>
                    {readOnly ? null : (
                        <div>
                            <input
                                type="checkbox"
                                class="input-base"
                                id="grp__check-search"
                                checked={enableSearching}
                                onClick={enableSearchingChanged}
                            />
                            <label for="grp__check-search">{Locale.grpSearch}</label>
                        </div>
                    )}
                    <label>{StringFormat.capFirst(Locale.icon)}:</label>
                    <div class="grp__icon-wrap">
                        {customIcon ? (
                            <img src={customIcon} class="grp__icon grp__icon--image" />
                        ) : (
                            <i class={`fa fa-${icon} grp__icon`} />
                        )}
                    </div>
                    <div class="grp__icons" />
                    {canAutoType ? (
                        <>
                            {readOnly ? null : (
                                <div>
                                    <input
                                        type="checkbox"
                                        class="input-base"
                                        id="grp__check-auto-type"
                                        checked={autoTypeEnabled}
                                        onClick={autoTypeEnabledChanged}
                                    />
                                    <label for="grp__check-auto-type">{Locale.grpAutoType}</label>
                                </div>
                            )}
                            <div class="grp__field">
                                <label for="grp__field-auto-type-seq">
                                    {Locale.grpAutoTypeSeq}:
                                </label>
                                <input
                                    type="text"
                                    class={classes({
                                        'input-base': true,
                                        'input--error': autoTypeSeqInvalid
                                    })}
                                    id="grp__field-auto-type-seq"
                                    value={autoTypeSeq}
                                    onInput={(e) =>
                                        autoTypeSeqChanged((e.target as HTMLInputElement).value)
                                    }
                                    size={50}
                                    maxLength={1024}
                                    placeholder={`${Locale.grpAutoTypeSeqDefault}: ${defaultAutoTypeSeq}`}
                                />
                                <AutoTypeHint for="grp__field-auto-type-seq" />
                            </div>
                        </>
                    ) : null}
                </div>
            </Scrollable>
            {readOnly ? null : (
                <div class="grp__buttons">
                    <i class="grp__buttons-trash fa fa-trash-alt" onClick={trashClicked}>
                        <kw-tip text={Locale.grpTrash} placement="right" />
                    </i>
                </div>
            )}
        </div>
    );
};
