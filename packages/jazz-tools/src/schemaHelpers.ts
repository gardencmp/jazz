/* eslint-disable @typescript-eslint/no-explicit-any */
import { AST } from "@effect/schema";
import * as S from "@effect/schema/Schema";

export type SchemaWithOutput<I> = S.Schema<any, any, never> & {
    [S.TypeId]: {
        _I: (_: any) => I;
    };
};

export type SchemaWithInputAndOutput<A, I = A> = S.Schema<any, any, never> & {
    [S.TypeId]: {
        _A: (_: any) => A;
        _I: (_: any) => I;
    };
};

export type PropertySignatureWithOutput<I> = S.PropertySignature<
    any,
    boolean,
    any,
    boolean,
    never
> & {
    [S.TypeId]: {
        _I: (_: any) => I | undefined;
    };
};

export type PropertySignatureWithInputAndOutput<I, A> = S.PropertySignature<
    any,
    boolean,
    any,
    boolean,
    never
> & {
    [S.TypeId]: {
        _A: (_: any) => A | undefined;
        _I: (_: any) => I | undefined;
    };
};

export type PropDef<I> =
    | S.Schema<I>
    | S.PropertySignature<I, boolean, I, boolean, never>;

export function CoSchema<Raw extends S.Schema<any>>(
    raw: Raw
): Raw & S.Schema<Raw, any, any> {
    return raw as any;
}

export function propSigToSchema<
    S extends S.Schema<any> | PropertySignatureWithInputAndOutput<any, any>,
>(
    propSig: S
): S extends S.Schema<any>
    ? S
    : S extends PropertySignatureWithInputAndOutput<infer A, infer I>
      ? S.Schema<A, I>
      : never {
    if ("ast" in propSig) {
        return propSig as any;
    } else {
        const ast = (
            propSig as unknown as {
                propertySignatureAST: { from: AST.AST };
            }
        ).propertySignatureAST;
        return S.make<any, unknown, never>(ast.from) as any;
    }
}

export function recursiveRef<T>(lazy: () => S.Schema<T>) {
    return S.union(S.undefined, S.suspend<T, T, never>(lazy));
}