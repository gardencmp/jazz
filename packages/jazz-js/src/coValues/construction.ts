import { Effect, Sink, Stream } from "effect";
import {
    AnyCoValueSchema,
    CoValue,
    ID,
    SubclassedConstructor,
} from "../coValueInterfaces.js";
import { UnavailableError } from "../errors.js";
import { ControlledAccount, ControlledAccountCtx } from "./account/account.js";
import { ValueRef } from "../refs.js";
import { SubscriptionScope } from "../subscriptionScope.js";

export abstract class SharedCoValueConstructor {
    static loadEf<V extends CoValue>(
        this: AnyCoValueSchema &
            SubclassedConstructor<V> &
            typeof SharedCoValueConstructor,
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
        this: AnyCoValueSchema &
            SubclassedConstructor<V> &
            typeof SharedCoValueConstructor,
        id: ID<V>,
        options: { as: ControlledAccount }
    ): Promise<V | undefined> {
        const value = await new ValueRef(id as ID<V>, options.as, this).load();

        if (value === "unavailable") {
            return undefined;
        } else {
            return value;
        }
    }

    static subscribe<V extends CoValue>(
        this: AnyCoValueSchema &
            SubclassedConstructor<V> &
            typeof SharedCoValueConstructor,
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

        return function unsubscribe() {

        }
    }

    static subscribeEf<V extends CoValue>(
        this: AnyCoValueSchema &
            SubclassedConstructor<V> &
            typeof SharedCoValueConstructor,
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
