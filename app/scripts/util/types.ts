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

export type InitWithFieldsOf<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in Extract<keyof T, string>]?: T[K] extends Function ? never : T[K];
};

export type Callback = () => void;

export interface Position {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
}
