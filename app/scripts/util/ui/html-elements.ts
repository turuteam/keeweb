export function elementBorderSize(el: HTMLElement): number {
    const style = window.getComputedStyle(el);
    let borderSize = parseInt(style.borderWidth, 10);
    if (style.boxShadow) {
        const sizes = style.boxShadow
            .split(' ')
            .filter((item) => item.endsWith('px'))
            .map((item) => parseInt(item, 10))
            .filter((item) => item > 0);
        borderSize += Math.max(...sizes);
    }
    return borderSize;
}
