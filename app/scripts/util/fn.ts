export function escape(str: string): string {
    if (!str) {
        return str;
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function noop(): void {
    // intentionally left blank
}

export function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function isEqual<T>(a: T, b: T): boolean {
    if (a === b) {
        return true;
    }
    if (a instanceof Date) {
        return +a === +b;
    }
    if (a instanceof Array && b instanceof Array) {
        return a.join(',') === b.join(',');
    }
    return false;
}

export function minmax(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
}

export function unreachable(msg: string, arg: never): never {
    throw new Error(`${msg}: ${String(arg)}`);
}

export function errorToString(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }
    const str = String(err);
    if (str === String({})) {
        return `Error: ${JSON.stringify(str)}`;
    }
    return str;
}
