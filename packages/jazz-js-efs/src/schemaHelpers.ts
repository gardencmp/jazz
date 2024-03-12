import * as S from "@effect/schema/Schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SchemaWithOutput<I> = S.Schema<any, any, never> & {
    [S.TypeId]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _I: (_: any) => I;
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SchemaWithInputAndOutput<A, I> = S.Schema<any, any, never> & {
    [S.TypeId]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _A: (_: any) => A;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _I: (_: any) => I;
    };
};

export type PropertySignatureWithInput<A> = S.PropertySignature<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    boolean,
    never
> & {
    [S.TypeId]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _A: (_: any) => A | undefined;
    };
};

export type PropDef<I> =
    | S.Schema<I>
    | S.PropertySignature<I, boolean, I, boolean, never>;

export function CoSchema<Raw extends S.Schema<any>>(raw: Raw): Raw & S.Schema<Raw, any, any> {
    return raw as any;
}