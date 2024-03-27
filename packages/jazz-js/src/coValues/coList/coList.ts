import { JsonValue, RawCoList, CojsonInternalTypes } from "cojson";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { CoValue, CoValueSchema } from "../../coValueInterfaces.js";
import { Schema } from "@effect/schema";
import { ValueRef } from "../../refs.js";
import { Account } from "../account/account.js";

/**
 *  @category Schemas & CoValues - CoList
 */
export interface CoListBase<
    Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
> extends CoValue<"CoList", RawCoList> {
    /** @category Collaboration metadata */
    readonly _refs: { [idx: number]: ValueRef<Schema.Schema.To<Item>> };
    readonly _edits: {
        [idx: number]: {
            value?: Schema.Schema.To<Item>;
            ref?: Item extends CoValueSchema
                ? ValueRef<Schema.Schema.To<Item>>
                : never;
            by?: Account;
            madeAt: Date;
            tx: CojsonInternalTypes.TransactionID;
        };
    };
}

/**
 *  @category Schemas & CoValues - CoList
 */
export type CoList<Item extends CoValueSchema | SchemaWithOutput<JsonValue>> =
    Array<
        Item extends CoValueSchema
            ? Schema.Schema.To<Item> | undefined
            : Schema.Schema.To<Item>
    > &
        CoListBase<Item>;

/**
 *  @category Schemas & CoValues - CoList
 */
export interface CoListSchema<
    Self,
    Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
> extends CoValueSchema<
        Self,
        CoList<Item>,
        "CoList",
        Schema.Schema.To<Item>[]
    > {}
