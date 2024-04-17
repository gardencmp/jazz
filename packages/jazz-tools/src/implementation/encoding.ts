import type { JsonValue } from "cojson";
import type { CoValue, CoValueClass } from "../internal.js";
import type { Schema, TypeId } from "@effect/schema/Schema";

export type JsonEncoded = "json";
export type EncodedAs<V> = { encoded: Encoder<V> };
export type RefEncoded<V extends CoValue> = {
    ref: () => CoValueClass<V>;
};

export type Encoding =
    | JsonEncoded
    | RefEncoded<CoValue>
    | EncodedAs<any>;

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
    Key extends string,
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

export type ValidItem<Item, ContainerType extends string> =
    NonNullable<Item> extends CoValue
        ? null extends Item
            ? any
            : [
                  `👋 CoList items that are CoValue references should be nullable, make sure the Item generic parameter of ${ContainerType} is:`,
                  Item | null
              ]
        : any;
