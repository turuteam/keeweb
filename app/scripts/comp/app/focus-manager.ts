import { Logger } from 'util/logger';

const logger = new Logger('focus-manager');

class FocusManager {
    private readonly _modalStack: string[] = [];

    get modal(): string | undefined {
        return this._modalStack[this._modalStack.length - 1];
    }

    pushModal(value: string): void {
        this._modalStack.push(value);
        logger.debug('Push modal', value);
    }

    popModal(): string | undefined {
        const lastModal = this._modalStack.pop();
        logger.debug('Pop modal', lastModal, '=>', this._modalStack[this._modalStack.length - 1]);
        return lastModal;
    }
}

const instance = new FocusManager();

export { instance as FocusManager };
