import { RawCoID } from "cojson/src/ids";
import {
    ControlledAccount,
    ControlledAccountCtx,
} from "./coValues/account/account.js";
import { CoValueCore } from "cojson";
import { SchemaWithInputAndOutput } from "./schemaHelpers.js";
import { Effect, Stream } from "effect";
import { UnavailableError } from "./errors.js";
import { Schema } from "@effect/schema";

export const tagSym = Symbol.for("@jazz/tag");
export type tagSym = typeof tagSym;

export const rawSym = Symbol.for("@jazz/raw");
export type rawSym = typeof rawSym;

export const schemaTagSym = Symbol.for("@jazz/schemaTag");
export type schemaTagSym = typeof schemaTagSym;

export type SchemaOf<T> = { new (...args: any[]): T, [schemaTagSym]: string };

export interface CoValueSchemaBase<
    Tag extends string = string,
    Value extends CoValue = CoValue,
    Init = any,
> {
    readonly [schemaTagSym]: Tag;

    new (init: undefined, options: { fromRaw: Value[rawSym] }): Value;
    new (init: Init, options: { owner: ControlledAccount }): Value;

    load<V extends Value>(
        this: SchemaOf<V>,
        id: ID<V>,
        options: { as: ControlledAccount }
    ): Promise<V | undefined>;

    loadEf<V extends Value>(
        this: SchemaOf<V>,
        id: ID<V>
    ): Effect.Effect<V, UnavailableError, ControlledAccountCtx>;

    subscribe<V extends Value>(
        this: SchemaOf<V>,
        id: ID<V>,
        options: { as: ControlledAccount },
        onUpdate: (value: V) => void
    ): Promise<void>;

    subscribeEf<V extends Value>(
        this: SchemaOf<V>,
        id: ID<V>
    ): Stream.Stream<V, UnavailableError, ControlledAccountCtx>;
}

export interface AnyCoValueSchema<
    Tag extends string = string,
    Value extends CoValue = CoValue,
    Decoded = any,
    Init = any,
> extends CoValueSchemaBase<Tag, Value, Init>,
        SchemaWithInputAndOutput<Value, Decoded> {}

export interface CoValueSchema<
    Self,
    Tag extends string,
    Value extends CoValue,
    Decoded,
    Init,
> extends CoValueSchemaBase<Tag, Value, Init>,
        Schema.Schema<Self, Decoded> {}

export function isCoValueSchema(value: any): value is AnyCoValueSchema {
    return value && value[schemaTagSym] !== undefined;
}

export const inspect = Symbol.for("nodejs.util.inspect.custom");
export type inspect = typeof inspect;

export interface CoValue<Tag extends string = string, Raw = any> {
    readonly id: ID<this>;
    readonly meta: CoValueMeta<this>;
    readonly [tagSym]: Tag;
    readonly [rawSym]: Raw;
    toJSON(): any;
    [inspect](): any;
}

export function isCoValue(value: any): value is CoValue {
    return value && value[tagSym] !== undefined;
}

export interface CoValueMeta<Value extends CoValue> {
    loadedAs: ControlledAccount;
    core: CoValueCore;
}

export type ID<T> = RawCoID & { readonly __type: (_: never) => T };
