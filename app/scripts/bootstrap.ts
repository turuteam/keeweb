import { h, render } from 'preact';
import { App } from 'ui/app';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('.app');
    if (root) {
        const app = h(App, null);
        render(app, document.body, root);
    }
});
