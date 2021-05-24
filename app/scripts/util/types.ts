export type NonFunctionPropertyNames<T> = NonNullable<
    {
        // eslint-disable-next-line @typescript-eslint/ban-types
        [K in Extract<keyof T, string>]: T[K] extends Function ? never : K;
    }[Extract<keyof T, string>]
>;

export type BooleanPropertyNames<T> = {
    [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

export type OptionalBooleanPropertyNames<T> = {
    [K in keyof T]: T[K] extends boolean | undefined ? K : never;
}[keyof T];

export type OptionalStringPropertyNames<T> = {
    [K in keyof T]: T[K] extends string | undefined ? K : never;
}[keyof T];

export type OptionalDatePropertyNames<T> = {
    [K in keyof T]: T[K] extends Date | undefined ? K : never;
}[keyof T];
