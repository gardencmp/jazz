import { Effect, Sink, Stream } from "effect";
import type { CojsonInternalTypes, RawCoValue } from "cojson";
import { RawAccount } from "cojson";
import type { Me, UnavailableError } from "../internal.js";
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
    /** @category Construction and loading */
    new (init: Init, options: { owner: Account | Group }): Value;

    /** @ignore */
    fromRaw(raw: Value["_raw"]): Value;

    /** @category Construction and loading */
    load<V extends Value>(
        this: ClassOf<V>,
        id: ID<V>,
        as: Account & Me,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        depth: any,
        options?: {
            onProgress?: (progress: number) => void;
        },
    ): Promise<V | undefined>;

    /** @category Construction and loading */
    loadEf<V extends Value>(
        this: ClassOf<V>,
        id: ID<V>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        depth: any,
    ): Effect.Effect<V, UnavailableError, AccountCtx>;

    /** @category Subscription */
    subscribe<V extends Value>(
        this: ClassOf<V>,
        id: ID<V>,
        as: Account & Me,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        depth: any,
        listener: (value: V) => void,
    ): () => void;

    /** @category Subscription */
    subscribeEf<V extends Value>(
        this: ClassOf<V>,
        id: ID<V>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        depth: any,
    ): Stream.Stream<V, UnavailableError, AccountCtx>;
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
    /** @category Subscription & Loading */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    load(depth: any): Promise<this | undefined>;
    /** @category Subscription & Loading */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadEf(depth: any): Effect.Effect<this, UnavailableError, AccountCtx>;
    /** @category Subscription & Loading */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribe(depth: any, listener: (update: this) => void): () => void;
    /** @category Subscription & Loading */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeEf(depth: any): Stream.Stream<this, UnavailableError, never>;
    /** @category Internals */
    _raw: Raw;
    /** @internal */
    readonly _loadedAs: Account & Me;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    load(depth: any): Promise<this | undefined> {
        return (this.constructor as CoValueClass<this>).load(
            this.id,
            this._loadedAs,
            depth,
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadEf(depth: any): Effect.Effect<this, UnavailableError, AccountCtx> {
        return (this.constructor as CoValueClass<this>)
            .loadEf(this.id, depth)
            .pipe(Effect.provideService(AccountCtx, this._loadedAs));
    }

    /** @category Subscription & Loading */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribe(depth: any, listener: (update: this) => void): () => void {
        return (this.constructor as CoValueClass<this>).subscribe(
            this.id,
            this._loadedAs,
            depth,
            listener,
        );
    }

    /** @category Subscription & Loading */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeEf(depth: any): Stream.Stream<this, UnavailableError, never> {
        return (this.constructor as CoValueClass<this>)
            .subscribeEf(this.id, depth)
            .pipe(Stream.provideService(AccountCtx, this._loadedAs));
    }

    /** @category Subscription & Loading */
    static load<V extends CoValue>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        as: Account & Me,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        depth: any,
    ): Promise<V | undefined> {
        return Effect.runPromise(
            this.loadEf(id, depth).pipe(
                Effect.mapError(() => undefined),
                Effect.merge,
                Effect.provideService(AccountCtx, as),
            ),
        );
    }

    /** @category Subscription & Loading */
    static loadEf<V extends CoValue>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        depth: any,
    ): Effect.Effect<V, UnavailableError, AccountCtx> {
        return this.subscribeEf(id, depth).pipe(
            Stream.runHead,
            Effect.andThen(
                Effect.mapError((_noSuchElem) => "unavailable" as const),
            ),
        );
    }

    /** @category Subscription & Loading */
    static subscribe<V extends CoValue>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        as: Account & Me,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        depth: any,
        listener: (value: V) => void,
    ): () => void {
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
    static subscribeEf<V extends CoValue>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        depth: any,
    ): Stream.Stream<V, UnavailableError, AccountCtx> {
        return AccountCtx.pipe(
            Effect.andThen((account) =>
                new Ref(id, account, this as CoValueClass<V>).loadEf(),
            ),
            Stream.fromEffect,
            Stream.flatMap((value) =>
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
            Stream.filter((update) => fulfillsDepth(depth, update)),
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