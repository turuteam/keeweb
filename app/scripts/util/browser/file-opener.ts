import { Logger } from 'util/logger';

let el: HTMLInputElement | undefined;

const logger = new Logger('file-reader');

export const FileOpener = {
    open(selected: (file: File) => void, accept?: string): void {
        el?.remove();

        el = document.createElement('input');
        el.type = 'file';
        el.classList.add('hide-by-pos');
        if (accept) {
            el.accept = accept;
        }
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

            selected(file);
            el?.remove();
        });
    },

    async readText(file: File): Promise<string> {
        const data = await this.readFile(file, true);
        if (typeof data === 'string') {
            return data;
        } else {
            throw new Error('Error reading file: expected a string');
        }
    },

    async readBinary(file: File): Promise<ArrayBuffer> {
        const data = await this.readFile(file, false);
        if (data instanceof ArrayBuffer) {
            return data;
        } else {
            throw new Error('Error reading file: expected an ArrayBuffer');
        }
    },

    readFile(file: File, asText: boolean): Promise<ArrayBuffer | string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.addEventListener('error', () => {
                logger.error('Error reading file', reader.error);
                reject('Error reading file');
            });
            reader.addEventListener('load', () => {
                if (reader.result === null) {
                    return reject('No data read from file');
                }
                resolve(reader.result);
            });

            if (asText) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }
};
