import * as kdbxweb from 'kdbxweb';
import { Events } from 'util/events';
import { SettingsStore } from 'comp/settings/settings-store';
import { Links } from 'const/links';
import { SignatureVerifier } from 'util/data/signature-verifier';
import { Logger } from 'util/logger';
import { PluginGalleryData } from 'plugins/types';

const PluginGallery = {
    logger: new Logger('plugin-gallery'),

    gallery: undefined as PluginGalleryData | undefined,
    loading: false,
    loadError: false,

    async loadPlugins(): Promise<PluginGalleryData> {
        if (this.gallery) {
            return Promise.resolve(this.gallery);
        }

        this.loading = true;
        this.loadError = false;

        const ts = this.logger.ts();
        try {
            const data = await new Promise<PluginGalleryData>((resolve, reject) => {
                this.logger.info('Loading plugins...');
                const xhr = new XMLHttpRequest();
                xhr.open('GET', Links.Plugins + '/plugins.json');
                xhr.responseType = 'json';
                xhr.send();
                xhr.addEventListener('load', () => {
                    const resp = xhr.response as PluginGalleryData;
                    if (!resp?.signature) {
                        return reject('Empty plugin gallery data');
                    }
                    resolve(resp);
                });
                xhr.addEventListener('error', () => {
                    reject('Network error during loading plugins');
                });
            });

            this.loading = false;
            await this.verifySignature(data);

            this.loadError = false;
            this.logger.info(`Loaded ${data.plugins.length} plugins`, this.logger.ts(ts));
            this.gallery = data;
            await this.saveGallery(data);

            Events.emit('plugin-gallery-load-complete');
            return this.gallery;
        } catch (e) {
            this.loading = false;
            this.loadError = true;
            this.logger.error('Error loading plugin gallery', e);
            Events.emit('plugin-gallery-load-complete');
            throw e;
        }
    },

    async verifySignature(gallery: PluginGalleryData): Promise<void> {
        const dataToVerify = JSON.stringify(gallery, null, 2).replace(gallery.signature, '');
        const valid = await SignatureVerifier.verify(
            kdbxweb.ByteUtils.stringToBytes(dataToVerify),
            gallery.signature
        );
        if (!valid) {
            this.logger.error('JSON signature invalid');
            throw new Error('JSON signature invalid');
        }
    },

    async getCachedGallery(): Promise<PluginGalleryData | undefined> {
        const ts = this.logger.ts();
        const data = (await SettingsStore.load('plugin-gallery')) as PluginGalleryData;
        if (data) {
            try {
                await this.verifySignature(data);
                this.logger.info('Loaded cached plugin gallery', this.logger.ts(ts));
                return data;
            } catch (err) {
                this.logger.error('Cannot load cached plugin gallery: signature validation error');
            }
        }
    },

    saveGallery(data: PluginGalleryData): Promise<void> {
        return SettingsStore.save('plugin-gallery', data);
    }
};

export { PluginGallery };
