import { JsonValue, RawCoList } from "cojson";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { CoValue, CoValueCo, CoValueSchema } from "../../coValueInterfaces.js";
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
    co: CoListCo<this, Item>;
}

/**
 *  @category Schemas & CoValues - CoList
 */
export type CoList<Item extends CoValueSchema | SchemaWithOutput<JsonValue>> =
    Schema.Schema.To<Item>[] & CoListBase<Item>;

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

/**
 *  @category Schemas & CoValues - CoList
 */
export interface CoListCo<
    Self extends CoValue,
    Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
> extends CoValueCo<"CoList", Self, RawCoList> {
    refs: { [idx: number]: ValueRef<Schema.Schema.To<Item>> };
    edits: { [idx: number]: {
        value: Schema.Schema.To<Item>
        ref: Item extends CoValueSchema ? ValueRef<Schema.Schema.To<Item>> : never;
        by: Account
        madeAt: Date
    }}
}
