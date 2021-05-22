import { h } from 'preact';
import { Logger } from 'util/logger';
import * as http from 'http';
import { TypedEmitter } from 'tiny-typed-emitter';
import { HtmlRenderer } from 'util/browser/html-renderer';
import { StorageOauthResult } from 'views/standalone/storage-oauth-result';

interface HttpOAuthListenerEvents {
    'ready': () => void;
    'error': (err: Error) => void;
    'result': (state: string | null, code: string | null) => void;
}

class HttpOAuthListener extends TypedEmitter<HttpOAuthListenerEvents> {
    readonly port: number;
    readonly storageName: string;

    constructor(port: number, storageName: string) {
        super();

        this.port = port;
        this.storageName = storageName;
    }

    get redirectUri(): string {
        return `http://localhost:${this.port}/oauth-result/${this.storageName}.html`;
    }
}

const DefaultPort = 48149;
const logger = new Logger('storage-oauth-listener');

let listenerServer: http.Server | undefined;

const StorageOAuthListener = {
    listen(storageName: string): HttpOAuthListener {
        if (listenerServer) {
            this.stop();
        }

        const listener = new HttpOAuthListener(DefaultPort, storageName);

        let resultHandled = false;
        const server = http.createServer((req, resp) => {
            const content = HtmlRenderer.renderToHtml(h(StorageOauthResult, null));
            resp.writeHead(200, 'OK', {
                'Content-Type': 'text/html; charset=UTF-8'
            });
            resp.end(content);
            if (!resultHandled && req.url) {
                this.stop();
                this.handleResult(req.url, listener);
                resultHandled = true;
            }
        });

        const port = DefaultPort;

        logger.info(`Starting OAuth listener on port ${port}...`);
        server.listen(port);

        server.on('error', (err) => {
            logger.error('Failed to start OAuth listener', err);
            listener.emit('error', new Error('Failed to start OAuth listener'));
            server?.close();
        });
        server.on('listening', () => {
            listenerServer = server;
            listener.emit('ready');
        });

        return listener;
    },

    stop(): void {
        if (listenerServer) {
            listenerServer.close();
            logger.info('OAuth listener stopped');

            listenerServer = undefined;
        }
    },

    handleResult(requestUrl: string, listener: HttpOAuthListener): void {
        const url = new URL(requestUrl, listener.redirectUri);
        if (url.origin + url.pathname !== listener.redirectUri) {
            logger.info('Skipped result', url, listener.redirectUri);
            return;
        }
        logger.info('OAuth result with code received');
        const state = url.searchParams.get('state');
        const code = url.searchParams.get('code');
        listener.emit('result', state, code);
    }
};

export { StorageOAuthListener };
