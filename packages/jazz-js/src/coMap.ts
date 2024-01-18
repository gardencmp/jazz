import {
    CoID,
    CoValue as RawCoValue,
    CoMap as RawCoMap,
    Account as RawAccount,
    ControlledAccount as RawControlledAccount,
} from "cojson";
import {
    ID,
    CoValue,
    CoValueSchemaBase,
    CoValueSchema,
    RawType,
    CoValueBase,
    SimpleAccount,
    CoValueMetaBase,
    subscriptionScopeSym,
} from "./index.js";
import { isCoValueSchema } from "./guards.js";
import { Schema } from "./schema.js";
import { Group } from "./group.js";
import { Account, ControlledAccount } from "./account.js";
import { Chunk, Effect, Scope, Stream, pipe } from "effect";
import { CoValueUnavailableError, UnknownCoValueLoadError } from "./errors.js";
import { ControlledAccountCtx } from "./services.js";
import { ValueRef } from "./valueRef.js";
import { SubscriptionScope } from "./subscriptionScope.js";

// type BaseCoMapShape = { [key: string]: Schema };
type BaseCoMapShape = Record<string, Schema>;

/** @category CoValues - CoMap */
export type CoMap<Shape extends BaseCoMapShape = BaseCoMapShape> = {
    [Key in keyof Shape]: Shape[Key]["_Value"] extends CoValue
        ? Shape[Key]["_Value"] | undefined
        : Shape[Key]["_Value"];
} & {
    id: ID<CoMap<Shape>>;
    meta: CoMapMeta<Shape>;
    subscribe: (listener: (newValue: CoMap<Shape>) => void) => () => void;
    [subscriptionScopeSym]?: SubscriptionScope;
} & CoValueBase;

type RawShape<Shape extends BaseCoMapShape> = {
    [Key in keyof Shape]: RawType<Shape[Key]>;
};

/** @category CoValues - CoMap */
export interface CoMapSchema<Shape extends BaseCoMapShape = BaseCoMapShape>
    extends Schema<CoMap<Shape>>,
        CoValueSchemaBase<CoMap<Shape>, RawCoMap<RawShape<Shape>>> {
    _Type: "comap";
    _Shape: Shape;

    new (
        init: CoMapInit<Shape>,
        opts: { owner: Account | Group }
    ): CoMap<Shape>;

    fromRaw<Raw extends RawCoMap<RawShape<Shape>>>(raw: Raw): CoMap<Shape>;
}

/** @category CoValues - CoMap */
export function isCoMapSchema(value: unknown): value is CoMapSchema {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "comap"
    );
}

/** @category CoValues - CoMap */
export function isCoMap(value: unknown): value is CoMap {
    return (
        typeof value === "object" &&
        value !== null &&
        isCoMapSchema(value.constructor) &&
        "id" in value
    );
}

type CoMapInitBase<Shape extends BaseCoMapShape> = {
    [Key in keyof Shape as null extends Shape[Key]["_Value"]
        ? never
        : Key]: Shape[Key]["_Value"];
} & {
    [Key in keyof Shape as null extends Shape[Key]["_Value"] ? Key : never]?:
        | Shape[Key]["_Value"]
        | null
        | undefined;
};

export type CoMapInit<Shape extends BaseCoMapShape> = Record<
    string,
    never
> extends CoMapInitBase<Shape>
    ? CoMapInitBase<Shape> | undefined
    : CoMapInitBase<Shape>;

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
            const scope = new SubscriptionScope(subscribable, (scope) => {
                const updatedValue = CoMapSchemaForShape.fromRaw(this._raw);
                updatedValue[subscriptionScopeSym] = scope;
                listener(updatedValue);
            });

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
                    json[key] = this._raw.get(key);
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
        const KeySchema = SchemaShape[key];

        if (isCoValueSchema(KeySchema)) {
            const KeyCoValueSchema = KeySchema as CoValueSchema;
            Object.defineProperty(CoMapSchemaForShape.prototype, key, {
                get(this: CoMapSchemaForShape) {
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
                        ref.value[subscriptionScopeSym] =
                            this[subscriptionScopeSym];
                        return ref.value;
                    }
                },
                set(this: CoMapSchemaForShape, value) {
                    this._raw.set(key, value?.id);
                    this[subscriptionScopeSym]?.onRefRemovedOrReplaced(
                        this.id,
                        key
                    );
                    if (value) {
                        this[subscriptionScopeSym]?.onRefAccessedOrSet(
                            this.id,
                            key,
                            value?.id,
                            KeyCoValueSchema
                        );
                    }
                },
            });

            Object.defineProperty(RefsForShape.prototype, key, {
                get(this: RefsForShape) {
                    const id = this.raw.get(key);

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
                    return this._raw.get(key);
                },
                set(this: CoMapSchemaForShape, value) {
                    this._raw.set(key, value);
                },
            });
        }
    }

    return CoMapSchemaForShape as CoMapSchema<Shape>;
}

class CoMapMeta<Shape extends BaseCoMapShape> implements CoValueMetaBase {
    _raw: RawCoMap<RawShape<Shape>>;
    owner: Account | Group;
    refs: RefsShape<Shape>;
    loadedAs: ControlledAccount;

    constructor(raw: RawCoMap<RawShape<Shape>>, refs: RefsShape<Shape>) {
        this._raw = raw;
        this.refs = refs;
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = Group.fromRaw(rawOwner);
        }
        this.loadedAs = SimpleAccount.ControlledSchema.fromRaw(
            this._raw.core.node.account as RawControlledAccount
        );
    }

    get core() {
        return this._raw.core;
    }
}

type RefsShape<Shape extends BaseCoMapShape> = {
    [Key in keyof Shape]?: Shape[Key]["_Value"] extends CoValue
        ? ValueRef<Shape[Key]["_Value"]>
        : never;
};
