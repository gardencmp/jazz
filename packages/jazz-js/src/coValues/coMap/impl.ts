import {
    CoID,
    RawCoMap as RawCoMap,
    RawControlledAccount as RawControlledAccount,
} from "cojson";
import { CoValueSchema, SimpleAccount } from "../../index.js";
import { subscriptionScopeSym } from "../../subscriptionScopeSym.js";
import { ID } from "../../id.js";
import { isCoValueSchema } from "../../guards.js";
import { Group } from "../group/group.js";
import { Account, ControlledAccount } from "../account/account.js";
import { Chunk, Effect, Ref, Stream } from "effect";
import {
    CoValueUnavailableError,
    UnknownCoValueLoadError,
} from "../../errors.js";
import { ControlledAccountCtx } from "../../services.js";
import { ValueRef } from "../../valueRef.js";
import { SubscriptionScope } from "../../subscriptionScope.js";
import { RawShape } from "./rawShape.js";
import { CoMapInit } from "./init.js";
import { CoMapMeta } from "./meta.js";
import { RefsShape } from "./refsShape.js";
import { BaseCoMapShape, CoMapSchema, CoMap } from "./coMap.js";

/** @category CoValues - CoMap */

export function CoMapOf<Shape extends BaseCoMapShape>(
    SchemaShape: Shape
): CoMapSchema<Shape> {
    class RefsForShape {
        raw: RawCoMap<RawShape<Shape>>;
        as: ControlledAccount;

        constructor(raw: RawCoMap<RawShape<Shape>>, as: ControlledAccount) {
            this.raw = raw;
            this.as = as;
        }
    }

    class CoMapSchemaForShape {
        static _Type = "comap" as const;
        static _Shape = SchemaShape;
        static _Value: CoMap<Shape> = "CoMap<Shape>" as unknown as CoMap<Shape>;
        static _RawValue: RawCoMap<RawShape<Shape>>;

        _raw: RawCoMap<RawShape<Shape>>;
        _refs: RefsShape<Shape>;
        [subscriptionScopeSym]?: SubscriptionScope;
        id: ID<CoMap<Shape>>;
        meta: CoMapMeta<Shape>;

        constructor(init: CoMapInit<Shape>, opts: { owner: Account });
        constructor(
            init: undefined,
            options: {
                fromRaw: RawCoMap<RawShape<Shape>>;
            }
        );
        constructor(
            init: CoMapInit<Shape> | undefined,
            options:
                | { owner: Group | Account }
                | {
                      fromRaw: RawCoMap<RawShape<Shape>>;
                  }
        ) {
            let raw: RawCoMap<RawShape<Shape>>;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
            } else if (init && options.owner) {
                const rawOwner = options.owner._raw;

                const initForInner = {} as RawCoMap<RawShape<Shape>>["_shape"];

                for (const key in init) {
                    const keySchema = SchemaShape[key];

                    if (isCoValueSchema(keySchema)) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        initForInner[key] = (init as any)[key].id;
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        initForInner[key] = (init as any)[key];
                    }
                }

                raw = rawOwner.createMap(initForInner);
            } else {
                throw new Error("Expected init and options");
            }

            this._raw = raw;
            this.id = raw.id as unknown as ID<CoMap<Shape>>;
            this._refs = new RefsForShape(
                raw,
                SimpleAccount.ControlledSchema.fromRaw(
                    raw.core.node.account as RawControlledAccount
                )
            ) as unknown as RefsShape<Shape>;
            this.meta = new CoMapMeta<Shape>(raw, this._refs);

            if (SchemaShape["..."]) {
                if (isCoValueSchema(SchemaShape["..."])) {
                    return new Proxy(this, {
                        get(target, key) {
                            if (key in target) {
                                return Reflect.get(target, key);
                            } else {
                                throw new Error("todo: extra key coValue get");
                            }
                        },
                        set(target, key, value) {
                            if (key in target) {
                                return Reflect.set(target, key, value);
                            } else {
                                throw new Error("todo: extra key coValue get");
                            }
                        },
                    });
                } else {
                    return new Proxy(this, {
                        get(target, key) {
                            if (key in target) {
                                return Reflect.get(target, key);
                            } else {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                return target._raw.get(key as any);
                            }
                        },
                        set(target, key, value) {
                            if (key in target) {
                                return Reflect.set(target, key, value);
                            } else {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                target._raw.set(key as any, value);
                                return true;
                            }
                        },
                    });
                }
            }
        }

        static fromRaw(raw: RawCoMap<RawShape<Shape>>): CoMap<Shape> {
            return new CoMapSchemaForShape(undefined, {
                fromRaw: raw,
            }) as CoMap<Shape>;
        }

        static load(
            id: ID<CoMap<Shape>>,
            { as }: { as: ControlledAccount }
        ): Promise<CoMap<Shape>> {
            return Effect.runPromise(
                Effect.provideService(
                    this.loadEf(id),
                    ControlledAccountCtx,
                    ControlledAccountCtx.of(as)
                )
            );
        }

        static loadEf(
            id: ID<CoMap<Shape>>
        ): Effect.Effect<
            ControlledAccountCtx,
            CoValueUnavailableError | UnknownCoValueLoadError,
            CoMap<Shape>
        > {
            return Effect.gen(function* ($) {
                const as = yield* $(ControlledAccountCtx);
                const raw = yield* $(
                    Effect.tryPromise({
                        try: () =>
                            as._raw.core.node.load(
                                id as unknown as CoID<RawCoMap<RawShape<Shape>>>
                            ),
                        catch: (cause) =>
                            new UnknownCoValueLoadError({ cause }),
                    })
                );

                if (raw === "unavailable") {
                    return yield* $(Effect.fail(new CoValueUnavailableError()));
                }

                return CoMapSchemaForShape.fromRaw(raw);
            });
        }

        static subscribeEf(
            id: ID<CoMap<Shape>>
        ): Stream.Stream<
            ControlledAccountCtx,
            CoValueUnavailableError | UnknownCoValueLoadError,
            CoMap<Shape>
        > {
            throw new Error(
                "TODO: implement somehow with Scope and Stream.asyncScoped"
            );
        }

        static subscribe(
            id: ID<CoMap<Shape>>,
            { as }: { as: ControlledAccount },
            onUpdate: (value: CoMap<Shape>) => void
        ): () => void {
            let unsub: () => void = () => {
                stopImmediately = true;
            };
            let stopImmediately = false;
            void this.load(id, { as }).then((value) => {
                unsub = value.subscribe(onUpdate);
                if (stopImmediately) {
                    unsub();
                }
            });

            return () => {
                unsub();
            };
        }

        subscribeEf(): Stream.Stream<never, never, CoMap<Shape>> {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this;
            return Stream.asyncScoped((emit) =>
                Effect.gen(function* ($) {
                    const unsub = self.subscribe((value) => {
                        void emit(Effect.succeed(Chunk.of(value)));
                    });

                    yield* $(Effect.addFinalizer(() => Effect.sync(unsub)));
                })
            );
        }

        subscribe(listener: (newValue: CoMap<Shape>) => void): () => void {
            const subscribable = CoMapSchemaForShape.fromRaw(this._raw);
            const scope = new SubscriptionScope(
                subscribable,
                CoMapSchemaForShape,
                (update) => {
                    listener(update);
                }
            );

            return () => {
                scope.unsubscribeAll();
            };
        }

        toJSON() {
            const json: Record<string, unknown> = {};

            for (const key in SchemaShape) {
                const keySchema = SchemaShape[key];

                if (isCoValueSchema(keySchema)) {
                    const ref = this._refs[key];
                    if (ref?.loaded) {
                        json[key] = ref.value.toJSON();
                    }
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    json[key] = this._raw.get(key as any);
                }
            }

            return json;
        }

        [Symbol.for("nodejs.util.inspect.custom")](
            _depth: number,
            _opts: unknown
        ) {
            return this.toJSON();
        }
    }

    for (const key in SchemaShape) {
        if (key === "...") {
            continue;
        }
        const KeySchema = SchemaShape[key];

        if (isCoValueSchema(KeySchema)) {
            const KeyCoValueSchema = KeySchema as CoValueSchema;
            Object.defineProperty(CoMapSchemaForShape.prototype, key, {
                get: makeCoValueGetterForKey(key, KeyCoValueSchema),
                set: makeCoValueSetterForKey(key, KeyCoValueSchema),
            });

            Object.defineProperty(RefsForShape.prototype, key, {
                get(this: RefsForShape) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const id = this.raw.get(key as any);

                    if (!id) {
                        return undefined;
                    }

                    const value = ValueRef(
                        id as unknown as ID<CoMap<Shape>>,
                        KeyCoValueSchema,
                        this.as
                    );

                    return value;
                },
            });
        } else {
            Object.defineProperty(CoMapSchemaForShape.prototype, key, {
                get(this: CoMapSchemaForShape) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return this._raw.get(key as any);
                },
                set(this: CoMapSchemaForShape, value) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    this._raw.set(key as any, value);
                },
            });
        }
    }

    function makeCoValueGetterForKey(
        key: string,
        KeyCoValueSchema: CoValueSchema
    ) {
        return function coValueGetterForKey(this: CoMapSchemaForShape) {
            const ref = this._refs[key]!;

            if (this[subscriptionScopeSym]) {
                this[subscriptionScopeSym].onRefAccessedOrSet(
                    this.id,
                    key,
                    ref.id,
                    KeyCoValueSchema
                );
            }

            if (ref.loaded) {
                ref.value[subscriptionScopeSym] = this[subscriptionScopeSym];
                return ref.value;
            }
        };
    }

    function makeCoValueSetterForKey(
        key: string,
        KeyCoValueSchema: CoValueSchema
    ) {
        return function coValueSetterForKey(
            this: CoMapSchemaForShape,
            value: CoValueSchema["_Value"]
        ) {
            this[subscriptionScopeSym]?.onRefRemovedOrReplaced(this.id, key);
            if (value) {
                this[subscriptionScopeSym]?.onRefAccessedOrSet(
                    this.id,
                    key,
                    value?.id,
                    KeyCoValueSchema
                );
            }
            this._raw.set(key, value?.id);
        };
    }

    return CoMapSchemaForShape as CoMapSchema<Shape>;
}
