import * as S from "@effect/schema/Schema";

export type SchemaWithOutput<I> = S.Schema<any, any, never> & {
    [S.TypeId]: {
        _I: (_: any) => I;
    };
};

export type SchemaWithInput<A> = S.Schema<any, any, never> & {
    [S.TypeId]: {
        _A: (_: A) => any;
    };
};

export type SchemaWithInputAndOutput<A, I> = S.Schema<any, any, never> & {
    [S.TypeId]: {
        _A: (_: A) => any;
        _I: (_: any) => I;
    };
};
