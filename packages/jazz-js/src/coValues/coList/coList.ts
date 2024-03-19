import { JsonValue, RawCoList } from "cojson";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import {
    CoValue,
    CoValueCo,
    CoValueSchema,
} from "../../coValueInterfaces.js";
import { Schema } from "@effect/schema";
import { ValueRef } from "../../refs.js";

export type CoList<
    Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
> = Schema.Schema.To<Item>[] &
    CoValue<"CoList", RawCoList> & {
        co: CoListCo<CoList<Item>, Item>;
    };


export interface CoListSchema<
    Self,
    Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
> extends CoValueSchema<
        Self,
        CoList<Item>,
        "CoList",
        Schema.Schema.To<Item>[]
    > {}

export interface CoListCo<
    Self extends CoValue,
    Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
> extends CoValueCo<"CoList", Self, RawCoList> {
    refs: { [idx: number]: ValueRef<Schema.Schema.To<Item>> };
}
