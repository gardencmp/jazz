import { CoValueCore, JsonValue, RawCoList } from "cojson";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import {
    AnyCoValueSchema,
    CoValue,
    CoValueSchema,
} from "../../coValueInterfaces.js";
import { Schema } from "@effect/schema";
import { ControlledAccount } from "../account/account.js";
import { ValueRef } from "../../refs.js";

export type CoList<
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> = Schema.Schema.To<Item>[] & CoValue<"CoList", RawCoList> & {
    meta: CoListMeta<Item>;
};

export interface AnyCoListSchema<
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> extends AnyCoValueSchema<
        "CoList",
        CoList<Item>,
        Schema.Schema.From<Item>[],
        Schema.Schema.To<Item>[]
    > {}

export interface CoListSchema<
    Self,
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> extends CoValueSchema<
        Self,
        "CoList",
        CoList<Item>,
        Schema.Schema.From<Item>[],
        Schema.Schema.To<Item>[]
    > {}

export interface CoListMeta<
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> {
    loadedAs: ControlledAccount;
    core: CoValueCore;
    refs: ValueRef<Schema.Schema.To<Item>>[];
}
