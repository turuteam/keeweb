export type NonFunctionPropertyNames<T> = NonNullable<
    {
        // eslint-disable-next-line @typescript-eslint/ban-types
        [K in Extract<keyof T, string>]: T[K] extends Function ? never : K;
    }[Extract<keyof T, string>]
>;

export type PropertiesOfType<T, PropType> = NonNullable<
    {
        [K in keyof T]: T[K] extends PropType ? K : never;
    }[keyof T]
>;
