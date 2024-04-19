import type { JsonValue, RawCoValue } from "cojson";
import type { CoValue, CoValueClass } from "../internal.js";
import type { Schema, TypeId } from "@effect/schema/Schema";

export type ValMarker = { readonly __field: unique symbol };
export type val<T> = T | (T & ValMarker);
export type IsVal<C, R> = C extends infer _A | infer B
    ? B extends ValMarker
        ? R
        : never
    : never;

export const SchemaInit = Symbol.for("SchemaInit");
export type SchemaInit = typeof SchemaInit;

export const InitValues = Symbol.for("InitValues");
export type InitValues = typeof InitValues;

export const ItemsSym = Symbol.for("items");
export type ItemsSym = typeof ItemsSym;

export const val = {
    string: {[SchemaInit]: "json" satisfies Encoding } as unknown as val<string>,
    number: {[SchemaInit]: "json" satisfies Encoding } as unknown as val<number>,
    boolean: {[SchemaInit]: "json" satisfies Encoding } as unknown as val<boolean>,
    literal: <T extends string | number | boolean>(
        _lit: T
    ): val<T> => {
        return {[SchemaInit]: "json" satisfies Encoding } as any;
    },
    json: <T extends JsonValue>(): val<T> => {
        return {[SchemaInit]: "json" satisfies Encoding } as any;
    },
    encoded: <T>(arg: Encoder<T>): val<T> => {
        return { [SchemaInit]: { encoded: arg } satisfies Encoding } as any;
    },
    ref: <C extends CoValueClass>(
        arg: (_raw: InstanceType<C>['_raw']) => C
    ): val<InstanceType<C> | null> => {
        return { [SchemaInit]: { ref: arg } satisfies Encoding } as any;
    },
    items: ItemsSym as ItemsSym,
}

export type JsonEncoded = "json";
export type EncodedAs<V> = { encoded: Encoder<V> };
export type RefEncoded<V extends CoValue> = {
    ref: (raw: RawCoValue) => CoValueClass<V>;
};

export type Encoding = JsonEncoded | RefEncoded<CoValue> | EncodedAs<any>;

export type EncodingFor<Field> = NonNullable<Field> extends CoValue
    ? RefEncoded<NonNullable<Field>>
    : NonNullable<Field> extends JsonValue
      ? JsonEncoded
      : EncodedAs<NonNullable<Field>>;

export type EffectSchemaWithInputAndOutput<A, I = A> = Schema<
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

export type EnsureCoValueNullable<
    V,
    Key extends string | ItemsSym,
> = NonNullable<V> extends CoValue
    ? null extends V
        ? V
        : Key extends string
          ? [
                `👋 CoMap fields that are CoValue references should be nullable, declare ${Key} as:`,
                V | null,
            ]
          : [
                `👋 CoMap fields that are CoValue references should be nullable, declare _item as:`,
                V | null,
            ]
    : V;

export type ValidItem<
    Item,
    ContainerType extends string,
> = NonNullable<Item> extends CoValue
    ? null extends Item
        ? any
        : [
              `👋 CoList items that are CoValue references should be nullable, make sure the Item generic parameter of ${ContainerType} is:`,
              Item | null,
          ]
    : any;
