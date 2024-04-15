import type { JsonValue } from "cojson";
import type { CoValue, CoValueClass } from "../internal.js";
import type { Schema, TypeId } from "@effect/schema/Schema";

export type PrimitiveField = "json";
export type EncodedField<V> = { encoded: Encoder<V> };
export type RefField<V extends CoValue> = {
    ref: () => CoValueClass<V>;
};

export type FieldDescriptor =
    | PrimitiveField
    | RefField<CoValue>
    | EncodedField<any>;

export type FieldDescriptorFor<Field> = NonNullable<Field> extends CoValue
    ? RefField<NonNullable<Field>>
    : NonNullable<Field> extends JsonValue
      ? PrimitiveField
      : EncodedField<NonNullable<Field>>;

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

export const indexSignature = Symbol.for("indexSignature");
export type indexSignature = typeof indexSignature;

export type EnsureCoValueNullable<
    V,
    Key extends string | indexSignature,
> = NonNullable<V> extends CoValue
    ? null extends V
        ? V
        : Key extends string
          ? [
                `👋 CoMap fields that are CoValue references should be nullable, declare ${Key} as:`,
                V | null,
            ]
          : [
                `👋 CoMap fields that are CoValue references should be nullable, declare [indexSignature] as:`,
                V | null,
            ]
    : V;

export type EnsureItemNullable<Item, ContainerType extends string> =
    NonNullable<Item> extends CoValue
        ? null extends Item
            ? any
            : [
                  `👋 CoList items that are CoValue references should be nullable, make sure the Item generic parameter of ${ContainerType} is:`,
                  Item | null
              ]
        : any;
