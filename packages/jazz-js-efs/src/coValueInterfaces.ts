import * as S from "@effect/schema/Schema";
import { RawCoValue } from "cojson";
import { RawCoID } from "cojson/src/ids";

export const coValueSym = Symbol("@jazz/coValue");
export const schemaTagSym = Symbol("@jazz/schemaTag");
export const valueOfSchemaSym = Symbol("@jazz/valueOfSchema");
export const rawCoValueSym = Symbol("@jazz/rawCoValue");

export interface CoValueSchema<
    Tag extends string = string,
    Value extends CoValue = CoValue,
> extends S.Schema<any, any, never> {
    [schemaTagSym]: Tag;
    [valueOfSchemaSym]: Value;
}

export type CoValue<
    Tag extends string = string,
    Raw extends any = any,
> = {
    [coValueSym]: Tag;
    [rawCoValueSym]: Raw;
};

export type ID<T> = RawCoID & { readonly __type: (_: never) => T };
