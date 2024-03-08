import { RawCoID } from "cojson/src/ids";
import { ControlledAccount, ControlledAccountCtx } from "./coValues/account/account.js";
import { CoValueCore } from "cojson";
import { SchemaWithInputAndOutput } from "./schemaHelpers.js";
import { Effect, Stream } from "effect";
import { UnavailableError } from "./errors.js";

export const tagSym = Symbol.for("@jazz/tag");
export type tagSym = typeof tagSym;

export const rawSym = Symbol.for("@jazz/raw");
export type rawSym = typeof rawSym;

export const schemaTagSym = Symbol.for("@jazz/schemaTag");
export type schemaTagSym = typeof schemaTagSym;

export interface CoValueSchema<
    Tag extends string = string,
    Value extends CoValue = CoValue,
    Decoded = any,
    Init = any,
> extends SchemaWithInputAndOutput<Value, Decoded> {
    readonly [schemaTagSym]: Tag;

    new (init: undefined, options: { fromRaw: Value[rawSym] }): Value;
    new (init: Init, options: { owner: ControlledAccount }): Value;

    load(
        id: ID<Value>,
        options: { as: ControlledAccount }
    ): Promise<Value | undefined>;

    loadEf(
        id: ID<Value>,
    ): Effect.Effect<Value, UnavailableError, ControlledAccountCtx>;

    subscribe(
        id: ID<Value>,
        options: { as: ControlledAccount },
        onUpdate: (value: Value) => void
    ): Promise<void>;

    subscribeEf(
        id: ID<Value>,
    ): Stream.Stream<Value, UnavailableError, ControlledAccountCtx>;
}

export function isCoValueSchema(value: any): value is CoValueSchema {
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

