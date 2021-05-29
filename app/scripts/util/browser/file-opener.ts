import { Logger } from 'util/logger';

let el: HTMLInputElement | undefined;

const logger = new Logger('file-reader');

export const FileOpener = {
    openText(selected: (file: File, data: string) => void): void {
        this.open((file, data) => {
            if (typeof data === 'string') {
                selected(file, data);
            } else {
                logger.error(`Error reading file: expected a string, got`, data);
            }
        }, true);
    },

    openBinary(selected: (file: File, data: ArrayBuffer) => void): void {
        this.open((file, data) => {
            if (data instanceof ArrayBuffer) {
                selected(file, data);
            } else {
                logger.error(`Error reading file: expected an ArrayBuffer, got`, data);
            }
        }, false);
    },

    open(selected: (file: File, data: unknown) => void, asText: boolean): void {
        el?.remove();

        el = document.createElement('input');
        el.type = 'file';
        el.classList.add('hide-by-pos');
        el.click();
        el.addEventListener('change', () => {
            const file = el?.files?.[0];
            if (!file) {
                logger.error('No file selected');
                el?.remove();
                return;
            }

            if (!file.name) {
                logger.error('File with empty name selected');
                el?.remove();
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('error', () => {
                el?.remove();
                logger.error('Error reading file');
            });
            reader.addEventListener('load', () => {
                selected(file, reader.result);
                el?.remove();
            });

            if (asText) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }
};
