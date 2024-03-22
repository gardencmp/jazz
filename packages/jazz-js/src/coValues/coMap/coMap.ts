import { CoValue, CoValueCo, CoValueSchema } from "../../coValueInterfaces.js";
import { JsonValue, RawCoMap } from "cojson";
import { ValueRef } from "../../refs.js";
import {
    PropertySignatureWithInput,
    SchemaWithInputAndOutput,
    SchemaWithOutput,
} from "../../schemaHelpers.js";
import { Schema } from "@effect/schema";
import { Simplify } from "effect/Types";

export type IndexSignature = {
    key: SchemaWithInputAndOutput<string, string>;
    value: CoMapFieldValue;
};

export interface CoMapBase<
    Fields extends CoMapFields,
    IdxSig extends IndexSignature = never,
> extends CoValue<"CoMap", RawCoMap> {
    co: CoMapCo<this, Fields, IdxSig>;
}

export type CoMap<
    Fields extends CoMapFields,
    IdxSig extends IndexSignature = never,
> = {
    [Key in keyof Fields]: Schema.Schema.To<Fields[Key]>;
} & {
    [Key in Schema.Schema.To<IdxSig["key"]>]: Schema.Schema.To<IdxSig["value"]>;
} & CoMapBase<Fields, IdxSig>;

export interface CoMapSchema<
    Self,
    Fields extends CoMapFields,
    IdxSig extends IndexSignature = never,
> extends CoValueSchema<
        Self,
        CoMap<Fields, IdxSig>,
        "CoMap",
        Simplify<CoMapInit<Fields, IdxSig>>
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
    IdxSig extends IndexSignature = never,
> = Schema.ToStruct<Fields> & {
    [Key in Schema.Schema.To<IdxSig["key"]>]: Schema.Schema.To<IdxSig["value"]>;
};

export type CoMapCo<
    Self extends CoValue,
    Fields extends CoMapFields,
    IdxSig extends IndexSignature = never,
> = CoValueCo<"CoMap", Self, RawCoMap> & {
    readonly refs: {
        [Key in keyof Fields]: Fields[Key] extends CoValueSchema<
            infer Self,
            infer Value
        >
            ? ValueRef<Self & Value>
            : never;
    } & {
        [Key in Schema.Schema.To<IdxSig["key"]>]: Schema.Schema.To<
            IdxSig["value"]
        > extends CoValueSchema<infer Self, infer Value>
            ? ValueRef<Self & Value>
            : never;
    };
};
