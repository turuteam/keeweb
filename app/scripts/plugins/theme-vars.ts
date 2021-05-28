import { Color } from 'util/data/color';

const ThemeVarsScss = require('!!raw-loader!../../styles/base/_theme-vars.scss') as string;
const ThemeDefaults = require('!!raw-loader!../../styles/themes/_theme-defaults.scss') as string;

type StyleVar = Color | string | number;

const ThemeFunctions: Record<string, (...args: StyleVar[]) => StyleVar> = {
    'mix'(color1: StyleVar, color2: StyleVar, percent: StyleVar): StyleVar {
        if (!(color1 instanceof Color)) throw new TypeError('color1 is not a Color');
        if (!(color2 instanceof Color)) throw new TypeError('color2 is not a Color');
        if (typeof percent !== 'number') throw new TypeError('percent is not a number');
        return color1.mix(color2, percent).toRgba();
    },
    'semi-mute-percent'(mutePercent: StyleVar): StyleVar {
        if (typeof mutePercent !== 'number') throw new TypeError('mutePercent is not a number');
        return mutePercent / 2;
    },
    'rgba'(color: StyleVar, alpha: StyleVar): StyleVar {
        if (!(color instanceof Color)) throw new TypeError('color is not a Color');
        if (typeof alpha !== 'number') throw new TypeError('alpha is not a number');
        const res = new Color(color);
        res.a = alpha;
        return res.toRgba();
    },
    'text-contrast-color'(
        color: StyleVar,
        lshift: StyleVar,
        thBg: StyleVar,
        thText: StyleVar
    ): StyleVar {
        if (!(color instanceof Color)) throw new TypeError('color is not a Color');
        if (typeof lshift !== 'number') throw new TypeError('lshift is not a number');
        if (!(thBg instanceof Color)) throw new TypeError('thBg is not a Color');
        if (!(thText instanceof Color)) throw new TypeError('thText is not a Color');
        if (color.l - lshift >= thBg.l) {
            return thText.toRgba();
        }
        return thBg.toRgba();
    },
    'lightness-alpha'(color: StyleVar, lightness: StyleVar, alpha: StyleVar): StyleVar {
        if (!(color instanceof Color)) throw new TypeError('color is not a Color');
        if (typeof lightness !== 'number') throw new TypeError('lightness is not a number');
        if (typeof alpha !== 'number') throw new TypeError('alpha is not a number');
        const res = new Color(color);
        res.l += Math.min(0, Math.max(1, lightness));
        res.a += Math.min(0, Math.max(1, alpha));
        return res.toHsla();
    },
    'shade'(color: StyleVar, percent: StyleVar): StyleVar {
        if (!(color instanceof Color)) throw new TypeError('color is not a Color');
        if (typeof percent !== 'number') throw new TypeError('percent is not a number');
        return Color.black.mix(color, percent).toRgba();
    }
};

const ThemeVars = {
    themeDefaults: undefined as Map<string, string> | undefined,
    newLineRegEx: /[\n\s]+/g, // don't inline it, see #1656
    themeVarsRegEx: /([\w\-]+):([^:]+),(\$)?/g,

    init(): void {
        if (this.themeDefaults) {
            return;
        }
        this.themeDefaults = new Map<string, string>();
        const propRegex = /\s([\w\-]+):\s*([^,\s]+)/g;
        let match;
        do {
            match = propRegex.exec(ThemeDefaults);
            if (match) {
                const [, name, value] = match;
                this.themeDefaults.set('--' + name, value);
            }
        } while (match);
    },

    apply(cssStyle: CSSStyleDeclaration): void {
        this.init();
        const matches = ThemeVarsScss.replace(this.newLineRegEx, '').matchAll(this.themeVarsRegEx);
        for (let [, name, def, last] of matches) {
            if (last && def.endsWith(')')) {
                // definitions are written like this:
                //      map-merge((def:val, def:val, ..., last-def:val),$t)
                // so, the last item has "),$" captured, here we're removing that bracket
                def = def.substr(0, def.length - 1);
            }
            const propName = '--' + name;
            const currentValue = cssStyle.getPropertyValue(propName);
            if (currentValue) {
                continue;
            }
            let result: StyleVar = def.replace(/map-get\(\$t,\s*([\w\-]+)\)/g, '--$1');
            let replaced = true;
            const locals: StyleVar[] = [];
            while (replaced) {
                replaced = false;
                result = result.replace(/([\w\-]+)\([^()]+\)/, (fnText) => {
                    replaced = true;
                    const [, name, argsStr] = /([\w\-]+)\((.*)\)/.exec(fnText) ?? [];
                    const args = argsStr
                        .trim()
                        .split(/\s*,\s*/)
                        .filter((arg) => arg)
                        .map((arg) => this.resolveArg(arg, cssStyle, locals));

                    if (typeof ThemeFunctions[name] !== 'function') {
                        throw new Error(`Unknown function: ${name}`);
                    }

                    locals.push(ThemeFunctions[name](...args));
                    return `L${locals.length - 1}`;
                });
            }
            result = locals[locals.length - 1];
            cssStyle.setProperty(propName, result.toString());
        }
    },

    resolveArg(arg: string, cssStyle: CSSStyleDeclaration, locals: StyleVar[]): StyleVar {
        if (/^--/.test(arg)) {
            let cssProp = cssStyle.getPropertyValue(arg);
            if (cssProp) {
                cssProp = cssProp.trim();
            }
            if (cssProp) {
                arg = cssProp;
            } else if (this.themeDefaults?.has(arg)) {
                arg = this.themeDefaults.get(arg) ?? '';
            } else {
                throw new Error('Css property missing: ' + arg);
            }
        }
        if (/^L/.test(arg)) {
            const ix = +arg.substr(1);
            return locals[ix];
        }
        if (/%$/.test(arg)) {
            return +arg.replace(/%$/, '') / 100;
        }
        if (/^-?[\d.]+?$/.test(arg)) {
            return +arg;
        }
        if (/^(#|rgb)/.test(arg)) {
            return new Color(arg);
        }
        throw new Error('Bad css arg: ' + arg);
    }
};

export { ThemeVars };
