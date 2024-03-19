import {
    CoValue,
    CoValueCo,
    CoValueSchema,
} from "../../coValueInterfaces.js";
import { JsonValue, RawCoMap } from "cojson";
import { ValueRef } from "../../refs.js";
import {
    PropertySignatureWithInput,
    SchemaWithOutput,
} from "../../schemaHelpers.js";
import { Schema } from "@effect/schema";
import { Simplify } from "effect/Types";

export interface CoMapBase<
    Fields extends CoMapFields,
    IdxKey extends Schema.Schema<string> = never,
    IdxVal extends CoMapFieldValue = never,
> extends CoValue<"CoMap", RawCoMap> {
    co: CoMapCo<this, Fields, IdxKey, IdxVal>;
}

export type CoMap<
    Fields extends CoMapFields,
    IdxKey extends Schema.Schema<string> = never,
    IdxVal extends CoMapFieldValue = never,
> = {
    [Key in keyof Fields]: Schema.Schema.To<Fields[Key]>;
} & {
    [Key in Schema.Schema.To<IdxKey>]: Schema.Schema.To<IdxVal>;
} & CoMapBase<Fields, IdxKey, IdxVal>;


export interface CoMapSchema<
    Self extends CoValue,
    Fields extends CoMapFields,
    IdxKey extends Schema.Schema<string> = Schema.Schema<string>,
    IdxVal extends CoValueSchema | SchemaWithOutput<JsonValue> =
        | CoValueSchema
        | SchemaWithOutput<JsonValue>,
> extends CoValueSchema<
        Self,
        CoMap<Fields, IdxKey, IdxVal>,
        "CoMap",
        Simplify<CoMapInit<Fields, IdxKey, IdxVal>>
    > {}

export type CoMapFieldValue =
    | CoValueSchema
    | SchemaWithOutput<JsonValue>
    | PropertySignatureWithInput<CoValue | JsonValue>;

export type CoMapFields = {
    [key: string]: CoMapFieldValue;
};

export type CoMapInit<
    Fields extends CoMapFields,
    IdxKey extends Schema.Schema<string> = never,
    IdxVal extends CoMapFieldValue = never,
> = Schema.ToStruct<Fields> & {
    [Key in Schema.Schema.To<IdxKey>]: Schema.Schema.To<IdxVal>;
};

export type CoMapCo<
    Self extends CoValue,
    Fields extends CoMapFields,
    IdxKey extends Schema.Schema<string>,
    IdxVal extends CoMapFieldValue,
> = CoValueCo<"CoMap", Self, RawCoMap> & {
    readonly refs: {
        [Key in keyof Fields]: Fields[Key] extends CoValueSchema<
            infer Self,
            infer Value
        >
            ? ValueRef<Self & Value>
            : never;
    } & {
        [Key in Schema.Schema.To<IdxKey>]: Schema.Schema.To<IdxVal> extends CoValueSchema<
            infer Self,
            infer Value
        >
            ? ValueRef<Self & Value>
            : never;
    };
};
