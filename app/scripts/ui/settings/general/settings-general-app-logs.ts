import { FunctionComponent, h } from 'preact';
import { SettingsGeneralAppLogsView } from 'views/settings/general/settings-general-app-logs-view';
import { Logger, LoggerLevel } from 'util/logger';
import { StringFormat } from 'util/formatting/string-format';

const LevelToColor: Partial<Record<LoggerLevel, string>> = {
    [LoggerLevel.Debug]: 'muted',
    [LoggerLevel.Warn]: 'yellow',
    [LoggerLevel.Error]: 'red'
};

const LevelToString: Record<LoggerLevel, string> = {
    [LoggerLevel.Off]: 'OFF',
    [LoggerLevel.All]: 'ALL',
    [LoggerLevel.Debug]: 'DEBUG',
    [LoggerLevel.Warn]: 'WARN',
    [LoggerLevel.Info]: 'INFO',
    [LoggerLevel.Error]: 'ERROR'
};

function mapArg(arg: unknown): string {
    if (arg === null) {
        return 'null';
    }
    if (arg === undefined) {
        return 'undefined';
    }
    if (arg === '') {
        return '""';
    }
    if (!arg || !String(arg) || typeof arg !== 'object') {
        return arg ? String(arg) : '';
    }
    if (arg instanceof Array) {
        return '[' + arg.map((item) => mapArg(item)).join(', ') + ']';
    }
    let str = String(arg);
    if (str === '[object Object]') {
        const cache = new Set<unknown>();
        str = JSON.stringify(arg, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) {
                    return;
                }
                cache.add(value);
            }
            return value as unknown;
        });
    }
    return str;
}

export const SettingsGeneralAppLogs: FunctionComponent = () => {
    const logs = Logger.getLast().map((item) => ({
        level: LevelToString[item.level],
        color: LevelToColor[item.level],
        msg:
            '[' +
            StringFormat.padStr(LevelToString[item.level], 5) +
            '] ' +
            item.args.map((arg) => mapArg(arg)).join(' ')
    }));

    return h(SettingsGeneralAppLogsView, {
        logs
    });
};
