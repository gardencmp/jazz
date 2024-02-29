import * as S from "@effect/schema/Schema";
import { RawCoID } from "cojson/src/ids";

export const coValueSym = Symbol.for("@jazz/coValue");
export type coValueSym = typeof coValueSym;

export const schemaTagSym = Symbol.for("@jazz/schemaTag");
export type schemaTagSym = typeof schemaTagSym;

export const valueOfSchemaSym = Symbol.for("@jazz/valueOfSchema");
export type valueOfSchemaSym = typeof valueOfSchemaSym;

export const rawCoValueSym = Symbol.for("@jazz/rawCoValue");
export type rawCoValueSym = typeof rawCoValueSym;

export interface CoValueSchema<
    Tag extends string = string,
    Value extends CoValue = CoValue,
> extends S.Schema<any, any, never> {
    readonly [schemaTagSym]: Tag;
    readonly [valueOfSchemaSym]: Value;
}

export function isCoValueSchema(value: any): value is CoValueSchema {
    return value && value[schemaTagSym] !== undefined;
}

export interface CoValue<
    Tag extends string = string,
    Raw = any,
> {
    readonly id: ID<this>;
    readonly [coValueSym]: Tag;
    readonly [rawCoValueSym]: Raw;
};

export function isCoValue(value: any): value is CoValue {
    return value && value[coValueSym] !== undefined;
}

export type ID<T> = RawCoID & { readonly __type: (_: never) => T };

export type CoMapInit<Fields> = {
    [Key in keyof Fields]?: Fields[Key] extends CoValueSchema
        ? Fields[Key][valueOfSchemaSym]
        : S.Schema.From<Fields[Key]>;
};

export type RawFields<Fields> = {
    [Key in keyof Fields]: Fields[Key] extends CoValueSchema
        ? ID<Fields[Key][valueOfSchemaSym][rawCoValueSym]>
        : S.Schema.From<Fields[Key]>;
};