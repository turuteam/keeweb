/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
// noinspection JSConstantReassignment

import * as path from 'path';
import * as fs from 'fs';
import { Crypto } from '@peculiar/webcrypto';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
const Module = require('module');

const jsdom = new JSDOM('', { url: 'https://app.keeweb.info' }).window;

global.crypto = new Crypto();
global.localStorage = jsdom.localStorage;
global.sessionStorage = jsdom.sessionStorage;
global.navigator = jsdom.navigator;
global.screen = jsdom.screen;
global.location = jsdom.location;
global.document = jsdom.document;
global.requestAnimationFrame = setTimeout;
global.HTMLElement = jsdom.HTMLElement;
global.customElements = jsdom.customElements;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.window = jsdom.window;

const DOMPurify = createDOMPurify(new JSDOM('').window as unknown as Window);
createDOMPurify.sanitize = DOMPurify.sanitize.bind(DOMPurify);

const appBasePath = path.resolve(__dirname, '..', 'app');

const replacements = [
    {
        match: /^locales\/[\w\-]+\.json$/,
        replace: (match: string) => path.join(appBasePath, match)
    }
];

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...rest: any[]): string {
    for (const { match, replace } of replacements) {
        request = request.replace(match, replace);
    }
    return originalResolveFilename.call(this, request, ...rest);
};

function requireTextFile(filePath: string): () => { default: string } {
    return () => {
        filePath = path.resolve(__dirname, '..', filePath);
        return { default: fs.readFileSync(filePath, 'utf8') };
    };
}

function requireBase64File(filePath: string): () => string {
    return () => {
        filePath = path.resolve(__dirname, '..', filePath);
        return fs.readFileSync(filePath, 'base64');
    };
}

const knownModules: Record<string, any> = {
    'demo.kdbx': requireBase64File('app/resources/demo.kdbx'),
    'public-key.pem': requireTextFile('app/resources/public-key.pem'),
    'public-key-new.pem': requireTextFile('app/resources/public-key-new.pem'),
    '!!raw-loader!../../styles/base/_theme-vars.scss': requireTextFile(
        'app/styles/base/_theme-vars.scss'
    ),
    '!!raw-loader!../../styles/themes/_theme-defaults.scss': requireTextFile(
        'app/styles/themes/_theme-defaults.scss'
    )
};

const originalRequire = Module.prototype.require;
Module.prototype.require = function (request: string, ...args: any[]): any {
    if (knownModules[request]) {
        return knownModules[request]();
    }
    return originalRequire.call(this, request, ...args);
};
