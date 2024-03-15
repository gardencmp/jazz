import { JsonValue, RawBinaryCoStream, RawCoStream, SessionID } from "cojson";
import {
    AnyCoValueSchema,
    CoValue,
    CoValueCo,
    CoValueSchema,
    ID,
} from "../../coValueInterfaces.js";
import { Account } from "../account/account.js";
import { ValueRef } from "../../refs.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { Schema } from "@effect/schema";

export type CoStream<
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> = CoValue<"CoStream", RawCoStream> & {
    co: CoStreamCo<CoStream<Item>, Item>;
} & {
    [key: CoStreamKey]: Schema.Schema.To<Item>;
};

export type CoStreamKey =
    | `${SessionID}-${number}`
    | `${SessionID}-latest`
    | `${ID<Account>}-${number}`
    | `${ID<Account>}-latest`;

export interface CoStreamCo<Self extends CoValue, Item>
    extends CoValueCo<"CoStream", Self, RawCoStream> {
    refs: {
        [key: CoStreamKey]: Item extends AnyCoValueSchema<infer _, infer Value>
            ? ValueRef<Value>
            : never;
    };
}

export interface AnyCoStreamSchema<
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> extends AnyCoValueSchema<
        "CoStream",
        CoStream<Item>,
        Schema.Schema.From<Item>,
        Schema.Schema.To<Item>[]
    > {}

export interface CoStreamSchema<
    Self,
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> extends CoValueSchema<
        Self,
        "CoStream",
        CoStream<Item>,
        Schema.Schema.From<Item>,
        Schema.Schema.To<Item>[]
    > {}

export interface BinaryCoStreamI extends CoValue<'BinaryCoStream', RawBinaryCoStream> {

}