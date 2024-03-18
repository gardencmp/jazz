import { RawCoID } from "cojson/src/ids";
import {
    Account,
    ControlledAccount,
    ControlledAccountCtx,
} from "./coValues/account/account.js";
import { CoValueCore } from "cojson";
import { SchemaWithInputAndOutput } from "./schemaHelpers.js";
import { Effect, Stream } from "effect";
import { UnavailableError } from "./errors.js";
import { Schema } from "@effect/schema";
import { Group } from "./coValues/group/group.js";

export type SubclassedConstructor<T> = { new (...args: any[]): T, type: string };

export interface CoValueConstructor<
    Type extends string = string,
    Value extends CoValue = CoValue,
    Init = any,
> {
    readonly type: Type;

    new(init: Init, options: { owner: Account | Group }): Value;

    fromRaw(raw: Value['co']['raw']): Value;

    load<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>,
        options: { as: ControlledAccount }
    ): Promise<V | undefined>;

    loadEf<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>
    ): Effect.Effect<V, UnavailableError, ControlledAccountCtx>;

    subscribe<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>,
        options: { as: ControlledAccount },
        onUpdate: (value: V) => void
    ): () => void;

    subscribeEf<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>
    ): Stream.Stream<V, UnavailableError, ControlledAccountCtx>;
}

export interface AnyCoValueSchema<
    Type extends string = string,
    Value extends CoValue = CoValue,
    Decoded = any,
    Init = any,
> extends CoValueConstructor<Type, Value, Init>,
        SchemaWithInputAndOutput<Value, Decoded> {}

export interface CoValueSchema<
    Self,
    Type extends string,
    Value extends CoValue,
    Decoded,
    Init,
> extends CoValueConstructor<Type, Value, Init>,
        Schema.Schema<Self, Decoded> {}

export function isCoValueSchema(value: any): value is AnyCoValueSchema {
    return value && value.type !== undefined;
}

export const inspect = Symbol.for("nodejs.util.inspect.custom");
export type inspect = typeof inspect;

export interface CoValue<Type extends string = string, Raw = any> {
    readonly co: CoValueCo<Type, this, Raw>;
    toJSON(): any[] | object;
    [inspect](): any;
}

export function isCoValue(value: any): value is CoValue {
    return value && value.co !== undefined;
}

export interface CoValueCo<type extends string, Value extends CoValue, Raw> {
    id: ID<Value>;
    type: type;
    raw: Raw;
    loadedAs: ControlledAccount;
    core: CoValueCore;
    subscribe(listener: (update: Value) => void): () => void;
    subscirbeEf(): Stream.Stream<Value, UnavailableError, ControlledAccountCtx>;
}

export type ID<T> = RawCoID & { readonly __type: (_: never) => T };
