import { JsonValue, RawCoList } from "cojson";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import {
    AnyCoValueSchema,
    CoValue,
    CoValueCo,
    CoValueSchema,
} from "../../coValueInterfaces.js";
import { Schema } from "@effect/schema";
import { ValueRef } from "../../refs.js";

export type CoList<
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> = Schema.Schema.To<Item>[] &
    CoValue<"CoList", RawCoList> & {
        co: CoListCo<CoList<Item>, Item>;
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

export interface CoListCo<
    Self extends CoValue,
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> extends CoValueCo<"CoList", Self, RawCoList> {
    refs: { [idx: number]: ValueRef<Schema.Schema.To<Item>> };
}
