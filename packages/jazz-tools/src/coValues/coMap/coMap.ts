import { CoValue, CoValueSchema } from "../../coValueInterfaces.js";
import { CojsonInternalTypes, JsonValue, RawCoMap } from "cojson";
import { ValueRef } from "../../refs.js";
import {
    PropertySignatureWithOutput,
    SchemaWithInputAndOutput,
    SchemaWithOutput,
} from "../../schemaHelpers.js";
import { Schema } from "@effect/schema";
import { Simplify } from "effect/Types";
import { AnyAccount } from "../account/account.js";

export type IndexSignature = {
    key: SchemaWithInputAndOutput<string, string>;
    value: CoMapFieldValue;
};

export type NoIndexSignature = {
    key: never;
    value: never;
};

/**
 *  @category Schemas & CoValues - CoMap
 */
export interface CoMapBase<
    Fields extends CoMapFields,
    IdxSig extends IndexSignature = never,
> extends CoValue<"CoMap", RawCoMap> {
    /** @category Referenced CoValues */
    readonly _refs: {
        [Key in keyof Fields as NonNullable<
            Schema.Schema.To<Fields[Key]>
        > extends CoValue
            ? Key
            : never]: ValueRef<NonNullable<Schema.Schema.To<Fields[Key]>>>;
    } & {
        [Key in Schema.Schema.To<IdxSig["key"]>]: NonNullable<
            Schema.Schema.To<IdxSig["value"]>
        > extends CoValue
            ? ValueRef<NonNullable<Schema.Schema.To<IdxSig["value"]>>>
            : never;
    };

    readonly _edits: {
        [Key in keyof Fields]: {
            value?: Schema.Schema.To<Fields[Key]>;
            ref?: NonNullable<Schema.Schema.To<Fields[Key]>> extends CoValue
                ? ValueRef<Schema.Schema.To<Fields[Key]>>
                : never;
            by?: AnyAccount;
            madeAt: Date;
            tx: CojsonInternalTypes.TransactionID;
        };
    } & {
        [Key in Schema.Schema.To<IdxSig["key"]>]: {
            value?: Schema.Schema.To<IdxSig["value"]>;
            ref?: Schema.Schema.To<IdxSig["value"]> extends CoValueSchema<
                infer Self,
                infer Value
            >
                ? ValueRef<Self & Value>
                : never;
            by?: AnyAccount;
            madeAt: Date;
            tx: CojsonInternalTypes.TransactionID;
        };
    };
}

/**
 *  @category Schemas & CoValues - CoMap
 */
export type CoMap<
    Fields extends CoMapFields,
    IdxSig extends IndexSignature | NoIndexSignature = NoIndexSignature,
> = {
    /** @category Specified fields */
    [Key in keyof Fields]: Schema.Schema.To<Fields[Key]>;
} & {
    [Key in Schema.Schema.To<IdxSig["key"]>]: Schema.Schema.To<IdxSig["value"]>;
} & CoMapBase<Fields, IdxSig>;

/** @category Schemas & CoValues - CoMap */
export interface CoMapSchema<
    Self,
    Fields extends CoMapFields,
    IdxSig extends IndexSignature | NoIndexSignature,
> extends CoValueSchema<
        Self,
        CoMap<Fields, IdxSig>,
        "CoMap",
        Simplify<CoMapInit<Fields, IdxSig>>
    > {}

export type CoMapFieldValue =
    | SchemaWithOutput<CoValue | undefined>
    | SchemaWithOutput<JsonValue>
    | PropertySignatureWithOutput<CoValue | JsonValue | undefined>;

export type CoMapFields = {
    [key: string]: CoMapFieldValue;
};

export type CoMapInit<
    Fields extends CoMapFields,
    IdxSig extends IndexSignature = never,
> = Schema.ToStruct<Fields> & {
    [Key in Schema.Schema.To<IdxSig["key"]>]: Schema.Schema.To<IdxSig["value"]>;
};
