import { Logger } from 'util/logger';

const logger = new Logger('focus-manager');

class FocusManager {
    private _modal?: string;

    get modal() {
        return this._modal;
    }

    set modal(value) {
        this._modal = value;
        logger.debug('Set modal', value);
    }
}

const instance = new FocusManager();

export { instance as FocusManager };
