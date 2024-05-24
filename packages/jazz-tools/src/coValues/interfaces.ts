import { Effect, Option, Sink, Stream } from "effect";
import type { CojsonInternalTypes, RawCoValue } from "cojson";
import { RawAccount } from "cojson";
import type {
    DeeplyLoaded,
    DepthsIn,
    UnavailableError,
} from "../internal.js";
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

export type ClassOf<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (...args: any[]): T;
};

/** @category Abstract interfaces */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CoValueClass<Value extends CoValue = CoValue, Init = any> {
    new (init: Init, options: { owner: Account | Group }): Value;

    /** @ignore */
    fromRaw(raw: Value["_raw"]): Value;

    /** @category Subscription & Loading */
    load<V extends Value, Depth>(
        this: ClassOf<V>,
        id: ID<V>,
        as: Account,
        depth: Depth & DepthsIn<V>,
    ): Promise<DeeplyLoaded<V, Depth> | undefined>;
    /** @category Subscription & Loading */
    load<V extends Value, Depth>(
        this: ClassOf<V>,
        existing: V,
        depth: Depth & DepthsIn<V>,
    ): Promise<DeeplyLoaded<V, Depth> | undefined>;

    /** @category Subscription & Loading */
    loadEf<V extends Value, Depth>(
        this: ClassOf<V>,
        id: ID<V>,
        depth: Depth & DepthsIn<V>,
    ): Effect.Effect<DeeplyLoaded<V, Depth>, UnavailableError, AccountCtx>;

    /** @category Subscription & Loading */
    subscribe<V extends Value, Depth>(
        this: ClassOf<V>,
        id: ID<V>,
        as: Account,
        depth: Depth & DepthsIn<V>,
        listener: (value: DeeplyLoaded<V, Depth>) => void,
    ): () => void;
    subscribe<V extends Value, Depth>(
        this: ClassOf<V>,
        existing: V,
        depth: Depth & DepthsIn<V>,
        listener: (value: DeeplyLoaded<V, Depth>) => void,
    ): () => void;

    /** @category Subscription & Loading */
    subscribeEf<V extends Value, Depth>(
        this: ClassOf<V>,
        id: ID<V>,
        depth: Depth & DepthsIn<V>,
    ): Stream.Stream<DeeplyLoaded<V, Depth>, UnavailableError, AccountCtx>;
}

/** @category Abstract interfaces */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CoValue<Type extends string = string, Raw = any> {
    /** @category Content */
    readonly id: ID<this>;
    /** @category Type Helpers */
    _type: Type;
    /** @category Collaboration */
    _owner: Account | Group;
    /** @category Internals */
    _raw: Raw;
    /** @internal */
    readonly _loadedAs: Account;
    /** @category Stringifying & Inspection */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toJSON(): any[] | object;
    /** @category Stringifying & Inspection */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [inspect](): any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isCoValue(value: any): value is CoValue {
    return value && value._type !== undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isCoValueClass(value: any): value is CoValueClass {
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
    static fromRaw<V extends CoValue>(this: ClassOf<V>, raw: RawCoValue): V {
        return new this({ fromRaw: raw });
    }

    /** @category Subscription & Loading */
    static load<V extends CoValue, Depth>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        as: Account,
        depth: Depth & DepthsIn<V>,
    ): Promise<DeeplyLoaded<V, Depth> | undefined>;
    /** @category Subscription & Loading */
    static load<V extends CoValue, Depth>(
        this: ClassOf<V> & typeof CoValueBase,
        existing: V,
        depth: Depth & DepthsIn<V>,
    ): Promise<DeeplyLoaded<V, Depth> | undefined>;
    static load<V extends CoValue, Depth>(
        this: ClassOf<V> & typeof CoValueBase,

        ...args:
            | [ID<V>, Account, Depth & DepthsIn<V>]
            | [V, Depth & DepthsIn<V>]
    ): Promise<DeeplyLoaded<V, Depth> | undefined> {
        const { id, as, depth } =
            args.length === 3
                ? { id: args[0], as: args[1], depth: args[2] }
                : { id: args[0].id, as: args[0]._loadedAs, depth: args[1] };
        return Effect.runPromise(
            this.loadEf(id, depth).pipe(
                Effect.mapError(() => undefined),
                Effect.merge,
                Effect.provideService(AccountCtx, as),
            ),
        );
    }

    /** @category Subscription & Loading */
    static loadEf<V extends CoValue, Depth>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        depth: Depth & DepthsIn<V>,
    ): Effect.Effect<DeeplyLoaded<V, Depth>, UnavailableError, AccountCtx> {
        return this.subscribeEf(id, depth).pipe(
            Stream.runHead,
            Effect.andThen(
                Effect.mapError((_noSuchElem) => "unavailable" as const),
            ),
        );
    }

    /** @category Subscription & Loading */
    static subscribe<V extends CoValue, Depth>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        as: Account,
        depth: Depth & DepthsIn<V>,
        listener: (value: DeeplyLoaded<V, Depth>) => void,
    ): () => void;
    static subscribe<V extends CoValue, Depth>(
        this: ClassOf<V> & typeof CoValueBase,
        existing: V,
        depth: Depth & DepthsIn<V>,
        listener: (value: DeeplyLoaded<V, Depth>) => void,
    ): () => void;
    static subscribe<V extends CoValue, Depth>(
        this: ClassOf<V> & typeof CoValueBase,
        ...args:
            | [
                  ID<V>,
                  Account,
                  Depth & DepthsIn<V>,
                  (value: DeeplyLoaded<V, Depth>) => void,
              ]
            | [V, Depth & DepthsIn<V>, (value: DeeplyLoaded<V, Depth>) => void]
    ): () => void {
        const { id, as, depth, listener } =
            args.length === 4
                ? {
                      id: args[0],
                      as: args[1],
                      depth: args[2],
                      listener: args[3],
                  }
                : {
                      id: args[0].id,
                      as: args[0]._loadedAs,
                      depth: args[1],
                      listener: args[2],
                  };
        void Effect.runPromise(
            Effect.provideService(
                this.subscribeEf(id, depth).pipe(
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

    /** @category Subscription & Loading */
    static subscribeEf<V extends CoValue, Depth>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        depth: Depth & DepthsIn<V>,
    ): Stream.Stream<DeeplyLoaded<V, Depth>, UnavailableError, AccountCtx> {
        return AccountCtx.pipe(
            Effect.andThen((account) =>
                new Ref(id, account, this as CoValueClass<V>).loadEf(),
            ),
            Stream.fromEffect,
            Stream.flatMap((value: V) =>
                Stream.asyncScoped<V, UnavailableError>((emit) =>
                    Effect.gen(this, function* (_) {
                        const subscription = new SubscriptionScope(
                            value,
                            this,
                            (update) => void emit.single(update as V),
                        );

                        yield* _(
                            Effect.addFinalizer(() =>
                                Effect.sync(() =>
                                    subscription.unsubscribeAll(),
                                ),
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

    /** @category Type Helpers*/
    as<C extends CoValueClass>(otherSchema: C): InstanceType<C> {
        const cast = otherSchema.fromRaw(this._raw) as InstanceType<C>;
        const subScope = subscriptionsScopes.get(this);
        if (subScope) {
            subscriptionsScopes.set(cast, subScope);
        }
        return cast;
    }
}
