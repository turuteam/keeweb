import { FunctionComponent } from 'preact';
import { classes } from 'util/ui/classes';
import { useLayoutEffect, useRef } from 'preact/hooks';

interface LogItem {
    level: string;
    msg: string;
    color?: string;
}

export const SettingsGeneralAppLogsView: FunctionComponent<{
    logs: LogItem[];
}> = ({ logs }) => {
    const lastLine = useRef<HTMLDivElement>();

    useLayoutEffect(() => {
        lastLine.current.scrollIntoView();
    }, []);

    return (
        <div class="settings__logs">
            {logs.map((log, ix) => (
                <pre
                    key={ix}
                    class={classes({
                        'settings__logs-log': true,
                        [`settings__logs-log--${log.level}`]: true,
                        [`${log.color || ''}-color`]: !!log.color
                    })}
                >
                    {log.msg}
                </pre>
            ))}
            <div class="settings__logs-last" ref={lastLine} />
        </div>
    );
};
