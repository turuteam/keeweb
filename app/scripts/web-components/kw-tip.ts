import preact from 'preact';
import { Timeouts } from 'const/timeouts';
import { Features } from 'util/features';

const TipsEnabled = !Features.isMobile;

type TipPlacement = 'top' | 'top-left' | 'right' | 'bottom' | 'left';

declare module 'preact' {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        type TipProperties = Partial<preact.JSX.HTMLAttributes> & {
            text: string;
            placement?: TipPlacement;
            fast?: boolean;
        };

        interface IntrinsicElements {
            'kw-tip': TipProperties;
        }
    }
}

class KwTip extends HTMLElement {
    private _removeListeners?: () => void;
    private _removeWindowResizeListener?: () => void;
    private _tipEl?: HTMLElement;
    private _showTimeout?: number;
    private _hideTimeout?: number;

    connectedCallback() {
        if (TipsEnabled) {
            this.listen();
        }
    }

    disconnectedCallback() {
        if (TipsEnabled) {
            this._removeListeners?.();
            this.removeTip();
        }
    }

    private listen() {
        this._removeListeners?.();

        const parent = this.parentElement;
        if (parent) {
            const showTip = () => this.showTip();
            const hideTip = () => this.hideTip();

            parent.addEventListener('mouseenter', showTip);
            parent.addEventListener('mouseleave', hideTip);
            parent.addEventListener('mousedown', hideTip);

            this._removeListeners = () => {
                parent.removeEventListener('mouseenter', showTip);
                parent.removeEventListener('mouseleave', hideTip);
                parent.removeEventListener('mousedown', hideTip);
                this._removeListeners = undefined;
            };
        }
    }

    private showTip() {
        if (this._tipEl || this._showTimeout) {
            return;
        }

        const text = this.getAttribute('text');
        if (!text) {
            return;
        }

        this._showTimeout = window.setTimeout(() => {
            this._showTimeout = undefined;

            if (!this.parentElement) {
                return;
            }

            this._tipEl = document.createElement('div');
            this._tipEl.classList.add('tip');
            this._tipEl.innerText = text;

            document.body.appendChild(this._tipEl);

            const rect = this.parentElement.getBoundingClientRect();
            const tipRect = this._tipEl.getBoundingClientRect();

            const placement =
                (this.getAttribute('placement') as TipPlacement) ||
                this.getAutoPlacement(rect, tipRect);

            this._tipEl.classList.add(`tip--${placement}`);

            const fast = this.getAttribute('fast') === 'true';
            if (fast) {
                this._tipEl.classList.add('tip--fast');
            }

            const pos = this.calcPos(rect, tipRect, placement);

            this._tipEl.style.top = `${pos.top}px`;
            this._tipEl.style.left = `${pos.left}px`;

            const windowResized = () => this.removeTip();
            window.addEventListener('resize', windowResized);
            this._removeWindowResizeListener = () =>
                window.removeEventListener('resize', windowResized);
        }, Timeouts.ShowTip);
    }

    private hideTip() {
        if (this._showTimeout) {
            clearTimeout(this._showTimeout);
            this._showTimeout = undefined;
        }
        if (this._tipEl && !this._hideTimeout) {
            this._tipEl.classList.add('tip--hide');
            this._hideTimeout = window.setTimeout(() => {
                this._hideTimeout = undefined;
                if (this._tipEl) {
                    this._tipEl.remove();
                    this._tipEl = undefined;
                }
                this._removeWindowResizeListener?.();
            }, Timeouts.HideTip);
        }
    }

    private removeTip() {
        if (this._showTimeout) {
            clearTimeout(this._showTimeout);
            this._showTimeout = undefined;
        }
        if (this._hideTimeout) {
            clearTimeout(this._hideTimeout);
            this._hideTimeout = undefined;
        }
        if (this._tipEl) {
            this._tipEl.remove();
            this._tipEl = undefined;
        }
        this._removeWindowResizeListener?.();
    }

    private getAutoPlacement(rect: DOMRect, tipRect: DOMRect): TipPlacement {
        const padding = 20;
        const bodyRect = document.body.getBoundingClientRect();
        const canShowToBottom = bodyRect.bottom - rect.bottom > padding + tipRect.height;
        const canShowToHalfRight = bodyRect.right - rect.right > padding + tipRect.width / 2;
        const canShowToRight = bodyRect.right - rect.right > padding + tipRect.width;
        const canShowToHalfLeft = rect.left > padding + tipRect.width / 2;
        const canShowToLeft = rect.left > padding + tipRect.width;
        if (canShowToBottom) {
            if (canShowToLeft && !canShowToHalfRight) {
                return 'left';
            } else if (canShowToRight && !canShowToHalfLeft) {
                return 'right';
            } else {
                return 'bottom';
            }
        }
        if (canShowToLeft && !canShowToHalfRight) {
            return 'left';
        } else if (canShowToRight && !canShowToHalfLeft) {
            return 'right';
        } else {
            return 'top';
        }
    }

    private calcPos(
        rect: DOMRect,
        tipRect: DOMRect,
        placement: TipPlacement
    ): { top: number; left: number } {
        let top: number, left: number;

        const offset = 10;
        const sideOffset = 10;

        switch (placement) {
            case 'top':
                top = rect.top - tipRect.height - offset;
                left = rect.left + rect.width / 2 - tipRect.width / 2;
                break;
            case 'top-left':
                top = rect.top - tipRect.height - offset;
                left = rect.left + rect.width / 2 - tipRect.width + sideOffset;
                break;
            case 'bottom':
                top = rect.bottom + offset;
                left = rect.left + rect.width / 2 - tipRect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2 - tipRect.height / 2;
                left = rect.left - tipRect.width - offset;
                break;
            case 'right':
                top = rect.top + rect.height / 2 - tipRect.height / 2;
                left = rect.right + offset;
                break;
        }

        return { top, left };
    }
}

customElements.define('kw-tip', KwTip);
