import { render, VNode } from 'preact';

const HtmlDoctype = '<!DOCTYPE html>';

const HtmlRenderer = {
    renderToHtml(component: VNode): string {
        const fragment = document.createDocumentFragment();
        render(component, fragment);

        const html = (fragment.firstChild as HTMLElement)?.outerHTML;

        return html ? HtmlDoctype + html : html;
    }
};

export { HtmlRenderer };
