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
    Value extends CoValue = CoValue,
    Type extends string = string,
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

export interface CoValueSchema<
    Self = any,
    Value extends CoValue = CoValue,
    Type extends string = string,
    Init = any,
> extends CoValueConstructor<Value, Type, Init>,
        Schema.Schema<Self, Self> {}

export function isCoValueSchema(value: any): value is CoValueSchema {
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
    subscribeEf(): Stream.Stream<Value, UnavailableError, ControlledAccountCtx>;
}

export type ID<T> = RawCoID & { readonly __type: (_: never) => T };
