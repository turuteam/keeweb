export function classes(cls: Record<string, boolean | undefined | null>): string {
    return Object.entries(cls)
        .filter(([, value]) => !!value)
        .map(([name]) => name)
        .join(' ');
}
