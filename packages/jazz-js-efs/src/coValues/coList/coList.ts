import { JsonValue, RawCoList } from "cojson";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import {
    AnyCoValueSchema,
    CoValue,
    CoValueSchema,
} from "../../coValueInterfaces.js";
import { Schema } from "@effect/schema";

export interface CoList<
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> extends Array<Schema.Schema.To<Item>>,
        CoValue<"CoList", RawCoList> {}

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
