import type { JsonValue, RawCoValue } from "cojson";
import { type CoValue, type CoValueClass, isCoValueClass } from "../internal.js";
import type { Schema as EffectSchema,  TypeId } from "@effect/schema/Schema";

export type CoMarker = { readonly __co: unique symbol };
export type co<T> = T | (T & CoMarker);
export type IfCo<C, R> = C extends infer _A | infer B
    ? B extends CoMarker
        ? R
        : never
    : never;

export const SchemaInit = Symbol.for("SchemaInit");
export type SchemaInit = typeof SchemaInit;

export const InitValues = Symbol.for("InitValues");
export type InitValues = typeof InitValues;

export const ItemsSym = Symbol.for("items");
export type ItemsSym = typeof ItemsSym;

export const co = {
    string: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<string>,
    number: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<number>,
    boolean: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<boolean>,
    literal: <T extends string | number | boolean>(_lit: T): co<T> => {
        return { [SchemaInit]: "json" satisfies Schema } as any;
    },
    json: <T extends JsonValue>(): co<T> => {
        return { [SchemaInit]: "json" satisfies Schema } as any;
    },
    encoded: <T>(arg: Encoder<T>): co<T> => {
        return { [SchemaInit]: { encoded: arg } satisfies Schema } as any;
    },
    ref: <C extends CoValueClass>(
        arg: C | ((_raw: InstanceType<C>["_raw"]) => C)
    ): co<InstanceType<C> | null> => {
        return { [SchemaInit]: arg satisfies Schema } as any;
    },
    items: ItemsSym as ItemsSym,
};

export type JsonEncoded = "json";
export type EncodedAs<V> = { encoded: Encoder<V> };
export type RefEncoded<V extends CoValue> =
    | CoValueClass<V>
    | ((raw: RawCoValue) => CoValueClass<V>);

export function isRefEncoded<V extends CoValue>(
    schema: Schema
): schema is RefEncoded<V> {
    return typeof schema === "function";
}

export function instantiateRefEncoded<V extends CoValue>(
    schema: RefEncoded<V>,
    raw: RawCoValue
): V {
    return isCoValueClass(schema)
        ? schema.fromRaw(raw)
        : (schema as (raw: RawCoValue) => CoValueClass<V>)(raw).fromRaw(raw);
}

export type Schema = JsonEncoded | RefEncoded<CoValue> | EncodedAs<any>;

export type SchemaFor<Field> = NonNullable<Field> extends CoValue
    ? RefEncoded<NonNullable<Field>>
    : NonNullable<Field> extends JsonValue
      ? JsonEncoded
      : EncodedAs<NonNullable<Field>>;

export type EffectSchemaWithInputAndOutput<A, I = A> = EffectSchema<
    any,
    any,
    never
> & {
    [TypeId]: {
        _A: (_: any) => A;
        _I: (_: any) => I;
    };
};

export type Encoder<V> = EffectSchemaWithInputAndOutput<V, JsonValue>;

import { Date } from "@effect/schema/Schema";

export const Encoders = {
    Date,
};
