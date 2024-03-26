import { Effect, Sink, Stream } from "effect";
import {
    CoValueSchema,
    CoValue,
    ID,
    SubclassedConstructor,
    CoValueCo,
} from "../coValueInterfaces.js";
import { UnavailableError } from "../errors.js";
import {
    Account,
    ControlledAccount,
    ControlledAccountCtx,
} from "./account/account.js";
import { ValueRef } from "../refs.js";
import { SubscriptionScope } from "../subscriptionScope.js";
import { CoValueCore, RawAccount, RawCoValue } from "cojson";
import {
    SimpleAccount,
    controlledAccountFromNode,
} from "./account/accountOf.js";
import { Group, SimpleGroup } from "../index.js";

export abstract class SharedCoValueConstructor {
    static loadEf<V extends CoValue>(
        this: CoValueSchema & SubclassedConstructor<V>,
        id: ID<V>
    ): Effect.Effect<V, UnavailableError, ControlledAccountCtx> {
        return Effect.gen(this, function* (_) {
            const controlledAccount = yield* _(ControlledAccountCtx);
            return yield* _(
                new ValueRef(id as ID<V>, controlledAccount, this).loadEf()
            );
        });
    }

    static async load<V extends CoValue>(
        this: CoValueSchema & SubclassedConstructor<V>,
        id: ID<V>,
        options: {
            as: ControlledAccount;
            onProgress?: (progress: number) => void;
        }
    ): Promise<V | undefined> {
        const value = await new ValueRef(id as ID<V>, options.as, this).load(
            options?.onProgress && { onProgress: options.onProgress }
        );

        if (value === "unavailable") {
            return undefined;
        } else {
            return value;
        }
    }

    static subscribe<V extends CoValue>(
        this: CoValueSchema & SubclassedConstructor<V>,
        id: ID<V>,
        options: { as: ControlledAccount },
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
                ControlledAccountCtx,
                options.as
            )
        );

        return function unsubscribe() {};
    }

    static subscribeEf<V extends CoValue>(
        this: CoValueSchema & SubclassedConstructor<V>,
        id: ID<V>
    ): Stream.Stream<V, UnavailableError, ControlledAccountCtx> {
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
}

export class CoValueCoImpl<
    Self extends V,
    V extends CoValue,
    T extends string,
    Raw extends RawCoValue,
    Refs,
> implements CoValueCo<T, Self, Raw>
{
    core: CoValueCore;
    loadedAs: ControlledAccount;
    owner: Account | Group;

    constructor(
        public id: ID<Self>,
        public type: T,
        public raw: Raw,
        public schema: CoValueSchema<Self, V>,
        public refs: Refs,
        loadedAs?: ControlledAccount
    ) {
        this.core = this.raw.core;
        this.loadedAs = loadedAs || controlledAccountFromNode(raw.core.node);
        this.owner =
            this.raw.group instanceof RawAccount
                ? SimpleAccount.fromRaw(this.raw.group)
                : SimpleGroup.fromRaw(this.raw.group);
    }

    subscribe(listener: (update: Self) => void): () => void {
        return (this.schema as CoValueSchema<Self, Self>).subscribe<Self>(
            this.id,
            { as: this.loadedAs },
            listener
        );
    }

    subscribeEf(): Stream.Stream<Self, UnavailableError, never> {
        return Stream.provideService(
            (this.schema as CoValueSchema<Self, Self>).subscribeEf<Self>(
                this.id
            ),
            ControlledAccountCtx,
            this.loadedAs
        );
    }
}
