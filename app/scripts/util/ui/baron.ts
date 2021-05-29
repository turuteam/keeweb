interface BaronParams {
    root: HTMLElement;
    scroller: HTMLElement;
    bar: HTMLElement;
    track?: HTMLElement;
    position?: 'absolute' | 'static';
    cssGuru?: boolean;
    impact?: 'scroller' | 'clipper';
    barOnCls?: string;
    scrollingCls?: string;
    draggingCls?: string;
    direction?: 'h' | 'v';
    resizeDebounce?: number;
    rtl?: boolean;
}

interface Baron {
    update(): void;
    dispose(): void;
}

const mod = require('baron') as {
    default: (params: BaronParams) => Baron;
};

const baron = mod.default;

export { baron };
