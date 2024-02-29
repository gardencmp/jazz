import { CoValueCore, RawCoValue as RawCoValue } from "cojson";
import { Account, ControlledAccount } from "./coValues/account/account.js";
import { Schema } from "./schema.js";
import { Effect, Stream } from "effect";
import { CoValueUnavailableError, UnknownCoValueLoadError } from "./errors.js";
import { ControlledAccountCtx } from "./services.js";
import { SubscriptionScope } from "./subscriptionScope.js";
import { CoValue } from "./index.js";
import { subscriptionScopeSym } from "./subscriptionScopeSym.js";
import { ID } from "./id.js";
import { Group } from "./coValues/group/group.js";

export interface CoValueSchemaBase<
    Value extends CoValue = CoValue,
    RawValue extends RawCoValue = RawCoValue,
> extends Schema<Value> {
    /** @category Type Hints */
    _RawValue: RawValue;

    fromRaw(raw: RawCoValue): Value;

    load(
        id: ID<Value>,
        { as }: { as: ControlledAccount }
    ): Promise<Value | undefined>;

    loadEf(
        id: ID<Value>
    ): Effect.Effect<
        Value,
        CoValueUnavailableError | UnknownCoValueLoadError,
        ControlledAccountCtx
    >;

    subscribe(
        id: ID<Value>,
        { as }: { as: ControlledAccount },
        onUpdate: (value: Value) => void
    ): () => void;

    subscribeEf(
        id: ID<Value>
    ): Stream.Stream<
        Value,
        CoValueUnavailableError | UnknownCoValueLoadError,
        ControlledAccountCtx
    >;
}

export interface CoValueBase {
    id: ID<CoValue>;
    meta: CoValueMetaBase;

    subscribe(onUpdate: (value: this) => void): () => void;

    subscribeEf(): Stream.Stream<this, never, never>;

    toJSON(): Record<string, unknown> | unknown[];

    [subscriptionScopeSym]?: SubscriptionScope;
}

export interface CoValueMetaBase {
    owner: Account | Group;
    core: CoValueCore;
    loadedAs: ControlledAccount;
}

export type RawType<T extends Schema> = T extends CoValueSchemaBase<
    infer _,
    infer _
>
    ? T["_RawValue"]
    : T["_Value"];
