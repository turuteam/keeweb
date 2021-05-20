import { expect } from 'chai';
import { h } from 'preact';
import { HtmlRenderer } from 'util/browser/html-renderer';

describe('HtmlRenderer', () => {
    it('renders content to html', () => {
        const component = h(
            'html',
            { lang: 'en' },
            h('head', null, h('meta', { charset: 'UTF-8' })),
            h('body', null, h('h1', null, 'Hello world!'))
        );
        const html = HtmlRenderer.renderToHtml(component);
        expect(html).to.eql(
            '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body><h1>Hello world!</h1></body></html>'
        );
    });
});
