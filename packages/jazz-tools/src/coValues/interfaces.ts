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

export type SubclassedConstructor<T> = {
    new (...args: any[]): T;
};

export interface CoValueClass<Value extends CoValue = CoValue, Init = any> {
    /** @category Construction and loading */
    new (init: Init, options: { owner: Account | Group }): Value;

    /** @ignore */
    fromRaw(raw: Value["_raw"]): Value;

    /** @category Construction and loading */
    load<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>,
        options: {
            as: Account & Me;
            onProgress?: (progress: number) => void;
        }
    ): Promise<V | undefined>;

    /** @category Construction and loading */
    loadEf<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>
    ): Effect.Effect<V, UnavailableError, AccountCtx>;

    /** @category Subscription */
    subscribe<V extends Value, Acc extends Account>(
        this: SubclassedConstructor<V>,
        id: ID<V>,
        options: { as: Acc & Me },
        onUpdate: (value: V) => void
    ): () => void;

    /** @category Subscription */
    subscribeEf<V extends Value>(
        this: SubclassedConstructor<V>,
        id: ID<V>
    ): Stream.Stream<V, UnavailableError, AccountCtx>;
}

/** @category Schemas & CoValues - Abstract interfaces */
export interface CoValue<Type extends string = string, Raw = any> {
    /** @category Value identity */
    readonly id: ID<this>;
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
    readonly _loadedAs: Account & Me;
    /** @category Stringifying & inspection */
    toJSON(): any[] | object;
    /** @category Stringifying & inspection */
    [inspect](): any;
}

export function isCoValue(value: any): value is CoValue {
    return value && value._type !== undefined;
}
export function isCoValueClass(value: any): value is CoValueClass {
    return typeof value === "function" && value.fromRaw !== undefined;
}

/** @category Schemas & CoValues - Abstract interfaces */
export type ID<T> = CojsonInternalTypes.RawCoID & IDMarker<T>;

type IDMarker<out T> = { __type(_: never): T };

export class CoValueBase implements CoValue {
    id!: ID<this>;
    _type!: string;
    _raw!: RawCoValue;

    get _owner(): Account | Group {
        const owner = this._raw.group instanceof RawAccount
            ? Account.fromRaw(this._raw.group)
            : Group.fromRaw(this._raw.group);

        const subScope = subscriptionsScopes.get(this);
        if (subScope) {
            subScope.onRefAccessedOrSet(owner.id);
            subscriptionsScopes.set(owner, subScope);
        }

        return owner;
    }

    /** @private */
    get _loadedAs() {
        return Account.fromNode(this._raw.core.node);
    }

    constructor(..._args: any) {}

    static fromRaw<V extends CoValue>(
        this: SubclassedConstructor<V>,
        raw: RawCoValue
    ): V {
        return new this({ fromRaw: raw });
    }

    static loadEf<V extends CoValue>(
        this: SubclassedConstructor<V> & typeof CoValueBase,
        id: ID<V>
    ): Effect.Effect<V, UnavailableError, AccountCtx> {
        return Effect.gen(this, function* (_) {
            const account = yield* _(AccountCtx);
            return yield* _(
                new Ref(id as ID<V>, account, this as CoValueClass<V>).loadEf()
            );
        });
    }

    static load<V extends CoValue>(
        this: SubclassedConstructor<V> & typeof CoValueBase,
        id: ID<V>,
        options: {
            as: Account & Me;
            onProgress?: (progress: number) => void;
        }
    ): Promise<V | undefined> {
        return new Ref(id as ID<V>, options.as, this as CoValueClass<V>).load(
            options?.onProgress && { onProgress: options.onProgress }
        );
    }

    static subscribe<V extends CoValue, Acc extends Account>(
        this: SubclassedConstructor<V> & typeof CoValueBase,
        id: ID<V>,
        options: { as: Acc & Me },
        onUpdate: (value: V) => void
    ): () => void {
        void Effect.runPromise(
            Effect.provideService(
                this.subscribeEf(id).pipe(
                    Stream.run(
                        Sink.forEach((update) =>
                            Effect.sync(() => onUpdate(update))
                        )
                    )
                ),
                AccountCtx,
                options.as as Account & Me
            )
        );

        return function unsubscribe() {};
    }

    static subscribeEf<V extends CoValue>(
        this: SubclassedConstructor<V> & typeof CoValueBase,
        id: ID<V>
    ): Stream.Stream<V, UnavailableError, AccountCtx> {
        return Stream.fromEffect(this.loadEf(id)).pipe(
            Stream.flatMap((value) =>
                Stream.asyncScoped<V, UnavailableError>((emit) =>
                    Effect.gen(this, function* (_) {
                        const subscription = new SubscriptionScope(
                            value,
                            this,
                            (update) => {
                                void emit.single(update as V);
                            }
                        );

                        yield* _(
                            Effect.addFinalizer(() =>
                                Effect.sync(() => subscription.unsubscribeAll())
                            )
                        );
                    })
                )
            )
        );
    }

    subscribe(listener: (update: this) => void): () => void {
        return (this.constructor as unknown as typeof CoValueBase).subscribe(
            this.id as unknown as ID<CoValue>,
            { as: this._loadedAs },
            listener as unknown as (update: CoValue) => void
        );
    }

    subscribeEf(): Stream.Stream<this, UnavailableError, never> {
        return Stream.provideService(
            (this.constructor as unknown as typeof CoValueBase).subscribeEf(
                this.id as unknown as ID<CoValue>
            ),
            AccountCtx,
            this._loadedAs
        ) as unknown as Stream.Stream<this, UnavailableError, never>;
    }

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

    as<C extends CoValueClass>(otherSchema: C): InstanceType<C> {
        const cast = otherSchema.fromRaw(this._raw) as InstanceType<C>;
        const subScope = subscriptionsScopes.get(this);
        if (subScope) {
            subscriptionsScopes.set(cast, subScope);
        }
        return cast;
    }
}
