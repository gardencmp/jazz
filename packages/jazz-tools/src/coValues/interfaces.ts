import { Effect, Option, Sink, Stream } from "effect";
import type { CojsonInternalTypes, RawCoValue } from "cojson";
import { RawAccount } from "cojson";
import type { DeeplyLoaded, DepthsIn, UnavailableError } from "../internal.js";
import {
    Account,
    AccountCtx,
    Group,
    SubscriptionScope,
    Ref,
    inspect,
    subscriptionsScopes,
} from "../internal.js";
import { fulfillsDepth } from "./deepLoading.js";

/** @category Abstract interfaces */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CoValueClass<Value extends CoValue = CoValue> {
    /** @ignore */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (...args: any[]): Value;
}

export interface CoValueFromRaw<V extends CoValue> {
    fromRaw(raw: V["_raw"]): V;
}

/** @category Abstract interfaces */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CoValue {
    /** @category Content */
    readonly id: ID<this>;
    /** @category Type Helpers */
    _type: string;
    /** @category Collaboration */
    _owner: Account | Group;
    /** @category Internals */
    _raw: RawCoValue;
    /** @internal */
    readonly _loadedAs: Account;
    /** @category Stringifying & Inspection */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toJSON(): any[] | object | string;
    /** @category Stringifying & Inspection */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [inspect](): any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isCoValue(value: any): value is CoValue {
    return value && value._type !== undefined;
}

export function isCoValueClass<V extends CoValue>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
): value is CoValueClass<V> & CoValueFromRaw<V> {
    return typeof value === "function" && value.fromRaw !== undefined;
}

/** @category CoValues */
export type ID<T> = CojsonInternalTypes.RawCoID & IDMarker<T>;

type IDMarker<out T> = { __type(_: never): T };

/** @internal */
export class CoValueBase implements CoValue {
    id!: ID<this>;
    _type!: string;
    _raw!: RawCoValue;
    /** @category Internals */
    _instanceID!: string;

    get _owner(): Account | Group {
        const owner =
            this._raw.group instanceof RawAccount
                ? Account.fromRaw(this._raw.group)
                : Group.fromRaw(this._raw.group);

        const subScope = subscriptionsScopes.get(this);
        if (subScope) {
            subScope.onRefAccessedOrSet(this.id, owner.id);
            subscriptionsScopes.set(owner, subScope);
        }

        return owner;
    }

    /** @private */
    get _loadedAs() {
        return Account.fromNode(this._raw.core.node);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(..._args: any) {
        Object.defineProperty(this, "_instanceID", {
            value: `instance-${Math.random().toString(36).slice(2)}`,
            enumerable: false,
        });
    }

    /** @category Internals */
    static fromRaw<V extends CoValue>(
        this: CoValueClass<V>,
        raw: RawCoValue,
    ): V {
        return new this({ fromRaw: raw });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toJSON(): object | any[] {
        return {
            id: this.id,
            type: this._type,
            error: "unknown CoValue class",
        };
    }

    [inspect]() {
        return this.toJSON();
    }

    /** @category Type Helpers */
    castAs<Cl extends CoValueClass & CoValueFromRaw<CoValue>>(
        cl: Cl,
    ): InstanceType<Cl> {
        return cl.fromRaw(this._raw) as InstanceType<Cl>;
    }
}

export function loadCoValue<V extends CoValue, Depth>(
    cls: CoValueClass<V>,
    id: ID<V>,
    as: Account,
    depth: Depth & DepthsIn<V>,
): Promise<DeeplyLoaded<V, Depth> | undefined> {
    return Effect.runPromise(
        loadCoValueEf(cls, id, depth).pipe(
            Effect.mapError(() => undefined),
            Effect.merge,
            Effect.provideService(AccountCtx, as),
        ),
    );
}

export function ensureCoValueLoaded<V extends CoValue, Depth>(
    existing: V,
    depth: Depth & DepthsIn<V>,
): Promise<DeeplyLoaded<V, Depth> | undefined> {
    return loadCoValue(
        existing.constructor as CoValueClass<V>,
        existing.id,
        existing._loadedAs,
        depth,
    );
}

export function loadCoValueEf<V extends CoValue, Depth>(
    cls: CoValueClass<V>,
    id: ID<V>,
    depth: Depth & DepthsIn<V>,
): Effect.Effect<DeeplyLoaded<V, Depth>, UnavailableError, AccountCtx> {
    return subscribeToCoValueEf(cls, id, depth).pipe(
        Stream.runHead,
        Effect.andThen(
            Effect.mapError((_noSuchElem) => "unavailable" as const),
        ),
    );
}

export function subscribeToCoValue<V extends CoValue, Depth>(
    cls: CoValueClass<V>,
    id: ID<V>,
    as: Account,
    depth: Depth & DepthsIn<V>,
    listener: (value: DeeplyLoaded<V, Depth>) => void,
): () => void {
    void Effect.runPromise(
        Effect.provideService(
            subscribeToCoValueEf(cls, id, depth).pipe(
                Stream.run(
                    Sink.forEach((update) =>
                        Effect.sync(() => listener(update)),
                    ),
                ),
            ),
            AccountCtx,
            as,
        ),
    );

    return function unsubscribe() {};
}

export function subscribeToExistingCoValue<V extends CoValue, Depth>(
    existing: V,
    depth: Depth & DepthsIn<V>,
    listener: (value: DeeplyLoaded<V, Depth>) => void,
): () => void {
    return subscribeToCoValue(
        existing.constructor as CoValueClass<V>,
        existing.id,
        existing._loadedAs,
        depth,
        listener,
    );
}

export function subscribeToCoValueEf<V extends CoValue, Depth>(
    cls: CoValueClass<V>,
    id: ID<V>,
    depth: Depth & DepthsIn<V>,
): Stream.Stream<DeeplyLoaded<V, Depth>, UnavailableError, AccountCtx> {
    return AccountCtx.pipe(
        Effect.andThen((account) =>
            new Ref(id, account, {
                ref: cls,
                optional: false,
            }).loadEf(),
        ),
        Stream.fromEffect,
        Stream.flatMap((value: V) =>
            Stream.asyncScoped<V, UnavailableError>((emit) =>
                Effect.gen(function* (_) {
                    const subscription = new SubscriptionScope(
                        value,
                        cls as CoValueClass<V> & CoValueFromRaw<V>,
                        (update) => void emit.single(update as V),
                    );

                    yield* _(
                        Effect.addFinalizer(() =>
                            Effect.sync(() => subscription.unsubscribeAll()),
                        ),
                    );
                }),
            ),
        ),
        Stream.filterMap((update: V) =>
            Option.fromNullable(
                fulfillsDepth(depth, update)
                    ? (update as DeeplyLoaded<V, Depth>)
                    : undefined,
            ),
        ),
    );
}
