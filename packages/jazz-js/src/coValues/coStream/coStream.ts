import {
    BinaryStreamInfo,
    JsonValue,
    RawBinaryCoStream,
    RawCoStream,
    SessionID,
} from "cojson";
import {
    AnyCoValueSchema,
    CoValue,
    CoValueCo,
    CoValueSchema,
    ID,
    SubclassedConstructor,
} from "../../coValueInterfaces.js";
import { Account } from "../account/account.js";
import { ValueRef } from "../../refs.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { Schema } from "@effect/schema";
import { Group } from "../group/group.js";

export type CoStream<
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> = CoValue<"CoStream", RawCoStream> & {
    co: CoStreamCo<CoStream<Item>, Item>;
} & {
    by: {[key: ID<Account>]: {latest?: Schema.Schema.To<Item>, all?: {value: Schema.Schema.To<Item>}}};
    in: {[key: SessionID]: {latest?: Schema.Schema.To<Item>, all?: {value: Schema.Schema.To<Item>}}};
};

export interface CoStreamCo<Self extends CoValue, Item>
    extends CoValueCo<"CoStream", Self, RawCoStream> {
    refs: {
        by: {
            [key: ID<Account>]: Item extends AnyCoValueSchema<infer _, infer Value>
                ? {latest: ValueRef<Value>, all: ValueRef<Value>[]}
                : never;
        },
        in: {
            [key: SessionID]: Item extends AnyCoValueSchema<infer _, infer Value>
                ? {latest: ValueRef<Value>, all: ValueRef<Value>[]}
                : never;
        };
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

export interface BinaryCoStream
    extends CoValue<"BinaryCoStream", RawBinaryCoStream> {
    start(options: BinaryStreamInfo): void;
    push(data: Uint8Array): void;
    end(): void;
    getChunks(options?: {
        allowUnfinished?: boolean;
    }): BinaryStreamInfo & { chunks: Uint8Array[]; finished: boolean };
}

export interface BinaryCoStreamSchema
    extends CoValueSchema<
        BinaryCoStream,
        "BinaryCoStream",
        BinaryCoStream,
        undefined,
        undefined
    > {
    load<V extends BinaryCoStream>(
        this: SubclassedConstructor<V>,
        id: ID<V>,
        options: {
            as: Account | Group;
            onProgress?: (progress: number) => void;
        }
    ): Promise<V | undefined>;
}
