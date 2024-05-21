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
        options: {
            as: Account & Me;
            onProgress?: (progress: number) => void;
        },
    ): Promise<V | undefined>;

    /** @category Construction and loading */
    loadEf<V extends Value>(
        this: ClassOf<V>,
        id: ID<V>,
    ): Effect.Effect<V, UnavailableError, AccountCtx>;

    /** @category Subscription */
    subscribe<V extends Value, Acc extends Account>(
        this: ClassOf<V>,
        id: ID<V>,
        options: { as: Acc & Me; require?: (value: V) => boolean | undefined },
        onUpdate: (value: V) => void,
    ): () => void;

    /** @category Subscription */
    subscribeEf<V extends Value>(
        this: ClassOf<V>,
        id: ID<V>,
        options?: { require?: (value: V) => boolean | undefined },
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
    subscribe(
        listener: (update: this) => void,
        options?: RequireOptions<this>,
    ): () => void;
    /** @category Subscription & Loading */
    subscribeEf(): Stream.Stream<this, UnavailableError, never>;
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

    /** @category Subscription & Loading */
    static loadEf<V extends CoValue>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
    ): Effect.Effect<V, UnavailableError, AccountCtx> {
        return Effect.gen(this, function* (_) {
            const account = yield* _(AccountCtx);
            return yield* _(
                new Ref(id as ID<V>, account, this as CoValueClass<V>).loadEf(),
            );
        });
    }

    /** @category Subscription & Loading */
    static load<V extends CoValue>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        options: {
            as: Account & Me;
            onProgress?: (progress: number) => void;
        },
    ): Promise<V | undefined> {
        return new Ref(id as ID<V>, options.as, this as CoValueClass<V>).load(
            options?.onProgress && { onProgress: options.onProgress },
        );
    }

    /** @category Subscription & Loading */
    static subscribe<V extends CoValue, Acc extends Account>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        options: { as: Acc & Me; require?: (value: V) => boolean | undefined },
        onUpdate: (value: V) => void,
    ): () => void {
        void Effect.runPromise(
            Effect.provideService(
                this.subscribeEf(id, { require: options.require }).pipe(
                    Stream.run(
                        Sink.forEach((update) =>
                            Effect.sync(() => onUpdate(update)),
                        ),
                    ),
                ),
                AccountCtx,
                options.as as Account & Me,
            ),
        );

        return function unsubscribe() {};
    }

    /** @category Subscription & Loading */
    static subscribeEf<V extends CoValue>(
        this: ClassOf<V> & typeof CoValueBase,
        id: ID<V>,
        options?: { require?: (value: V) => boolean | undefined },
    ): Stream.Stream<V, UnavailableError, AccountCtx> {
        return Stream.fromEffect(this.loadEf(id)).pipe(
            Stream.flatMap((value) =>
                Stream.asyncScoped<V, UnavailableError>((emit) =>
                    Effect.gen(this, function* (_) {
                        const subscription = new SubscriptionScope(
                            value,
                            this,
                            (update) => {
                                if (
                                    !options?.require ||
                                    options.require(update)
                                ) {
                                    void emit.single(update as V);
                                }
                            },
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
        );
    }

    /** @category Subscription & Loading */
    subscribe(
        listener: (update: this) => void,
        options?: RequireOptions<this>,
    ): () => void {
        return (this.constructor as unknown as typeof CoValueBase).subscribe(
            this.id as unknown as ID<CoValue>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { as: this._loadedAs, require: options?.require as any },
            listener as unknown as (update: CoValue) => void,
        );
    }

    /** @category Subscription & Loading */
    subscribeEf(
        options?: RequireOptions<this>,
    ): Stream.Stream<this, UnavailableError, never> {
        return Stream.provideService(
            (this.constructor as unknown as typeof CoValueBase).subscribeEf(
                this.id as unknown as ID<CoValue>,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                options as any,
            ),
            AccountCtx,
            this._loadedAs,
        ) as unknown as Stream.Stream<this, UnavailableError, never>;
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

export type RequireOptions<V extends CoValue> = {
    require?: (value: V) => boolean | undefined;
};
