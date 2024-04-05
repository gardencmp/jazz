import {
    BinaryStreamInfo,
    CojsonInternalTypes,
    JsonValue,
    RawBinaryCoStream,
    RawCoStream,
    SessionID,
} from "cojson";
import { CoValue, CoValueSchema, ID } from "../../coValueInterfaces.js";
import { AnyAccount } from "../account/account.js";
import { ValueRef } from "../../refs.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { Schema } from "@effect/schema";

export type CoStreamEntry<
    Item extends SchemaWithOutput<CoValue> | SchemaWithOutput<JsonValue>,
> = {
    value: Item extends CoValueSchema<infer Self>
        ? Self | undefined
        : Schema.Schema.To<Item>;
    ref?: Item extends CoValueSchema<infer Self, infer Value>
        ? ValueRef<Self & Value>
        : never;
    by?: AnyAccount;
    madeAt: Date;
    tx: CojsonInternalTypes.TransactionID;
};

export type CoStream<
    Item extends SchemaWithOutput<CoValue> | SchemaWithOutput<JsonValue>,
> = CoValue<"CoStream", RawCoStream> & {
    by: {
        [key: ID<AnyAccount>]: CoStreamEntry<Item>;
    };
    byMe: CoStreamEntry<Item> | undefined;
    in: {
        [key: SessionID]: CoStreamEntry<Item>;
    };
    inCurrentSession: CoStreamEntry<Item> | undefined;
    push(...items: Schema.Schema.To<Item>[]): void;
};

export interface CoStreamSchema<
    Self,
    Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
> extends CoValueSchema<
        Self,
        CoStream<Item>,
        "CoStream",
        Schema.Schema.To<Item>[]
    > {}

export interface BinaryCoStream
    extends CoValue<"BinaryCoStream", RawBinaryCoStream> {
    start(options: BinaryStreamInfo): void;
    push(data: Uint8Array): void;
    end(): void;
    getChunks(options?: { allowUnfinished?: boolean }):
        | (BinaryStreamInfo & {
              chunks: Uint8Array[];
              finished: boolean;
          })
        | undefined;
}

export interface BinaryCoStreamSchema
    extends CoValueSchema<
        BinaryCoStream,
        BinaryCoStream,
        "BinaryCoStream",
        undefined
    > {}
