import { RawCoID } from "cojson/src/ids";
import {
    Account,
    ControlledAccount,
    ControlledAccountCtx,
} from "./coValues/account/account.js";
import { CoValueCore } from "cojson";
import { Effect, Stream } from "effect";
import { UnavailableError } from "./errors.js";
import { Schema } from "@effect/schema";
import { Group } from "./coValues/group/group.js";

export type SubclassedConstructor<T> = {
    new (...args: any[]): T;
    type: string;
};

export interface CoValueConstructor<
    Value extends CoValue = CoValue,
    Type extends string = string,
    Init = any,
> {
    readonly type: Type;

    /** @category Construction and loading */
    new (init: Init, options: { owner: Account | Group }): Value;

    /** @ignore */
    fromRaw(raw: Value["_raw"]): Value;

    /** @category Construction and loading */
    load<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>,
        options: { as: ControlledAccount, onProgress?: (progress: number) => void }
    ): Promise<V | undefined>;

    /** @category Construction and loading */
    loadEf<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>
    ): Effect.Effect<V, UnavailableError, ControlledAccountCtx>;

    /** @category Subscription */
    subscribe<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>,
        options: { as: ControlledAccount },
        onUpdate: (value: V) => void
    ): () => void;

    /** @category Subscription */
    subscribeEf<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>
    ): Stream.Stream<V, UnavailableError, ControlledAccountCtx>;
}

/** @category Schemas & CoValues - Abstract interfaces */
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

/** @category Schemas & CoValues - Abstract interfaces */
export interface CoValue<Type extends string = string, Raw = any> {
    /** @category Value identity */
    id: ID<this>;
    /** @category Value identity */
    _type: Type;
    /** @category Collaboration */
    _owner: Account | Group;
    /** @category Subscription */
    subscribe(listener: (update: this) => void): () => void;
    /** @category Subscription */
    subscribeEf(): Stream.Stream<this, UnavailableError, never>;
    /** @category Internals */
    _raw: Raw;
    /** @category Internals */
    _loadedAs: ControlledAccount;
    /** @category Internals */
    _schema: CoValueSchema;
    /** @category Stringifying & inspection */
    toJSON(): any[] | object;
    /** @category Stringifying & inspection */
    [inspect](): any;
}

export function isCoValue(value: any): value is CoValue {
    return value && value._type !== undefined;
}

/** @category Schemas & CoValues - Abstract interfaces */
export type ID<T> = RawCoID & { readonly __type: (_: never) => T };
