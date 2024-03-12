import { isTypeLiteral } from "@effect/schema/AST";
import {
    ID,
    schemaTagSym,
    tagSym,
    rawSym,
    isCoValueSchema,
    isCoValue,
    CoValue,
    inspect,
    AnyCoValueSchema,
} from "../../coValueInterfaces.js";
import {
    CoMapFields,
    CoMap,
    CoMapMeta,
    CoMapInit,
    CoMapSchema,
} from "./coMap.js";
import { ValueRef, makeRefs } from "../../refs.js";
import { JsonValue, RawCoMap } from "cojson";
import { Group } from "../group/group.js";
import {
    Account,
    ControlledAccount,
    ControlledAccountCtx,
} from "../account/account.js";
import { Effect, Sink, Stream } from "effect";
import { controlledAccountFromNode } from "../account/accountOf.js";
import { UnavailableError } from "../../errors.js";
import {
    SubscriptionScope,
    subscriptionsScopes,
} from "../../subscriptionScope.js";
import { AST, Schema } from "@effect/schema";
import {
    constructorOfSchemaSym,
    propertyIsCoValueSchema,
} from "../resolution.js";

export function CoMapOf<Fields extends CoMapFields>(fields: Fields) {
    const struct = Schema.struct(fields) as unknown as Schema.Schema<
        CoMapOfFields,
        Schema.FromStruct<Fields>,
        never
    >;

    class CoMapOfFields implements CoValue<"CoMap", RawCoMap> {
        static ast = AST.setAnnotation(
            struct.ast,
            constructorOfSchemaSym,
            this
        );
        static [Schema.TypeId] = struct[Schema.TypeId];
        static pipe = struct.pipe;
        static [schemaTagSym] = "CoMap" as const;

        [tagSym] = "CoMap" as const;
        [rawSym]: RawCoMap;

        id: ID<this>;
        meta!: CoMapMeta<Fields>;

        constructor(_init: undefined, options: { fromRaw: RawCoMap });
        constructor(
            init: CoMapInit<Fields>,
            options: { owner: Account | Group }
        );
        constructor(
            init: CoMapInit<Fields> | undefined,
            options: { owner: Account | Group } | { fromRaw: RawCoMap }
        ) {
            if (!isTypeLiteral(struct.ast)) {
                throw new Error("CoMap AST must be type literal");
            }

            if ("fromRaw" in options) {
                this[rawSym] = options.fromRaw;
            } else {
                const rawOwner = options.owner[rawSym];

                const rawInit = {} as {
                    [key in keyof CoMapInit<Fields>]: JsonValue | undefined;
                };

                if (init)
                    for (const key of Object.keys(
                        init
                    ) as (keyof CoMapInit<Fields>)[]) {
                        const propertySignature =
                            struct.ast.propertySignatures.find(
                                (signature) => signature.name === key
                            );
                        const initValue = init[key];
                        const field = fields[key];

                        if (field && propertyIsCoValueSchema(field)) {
                            // TOOD: check for alignment of actual value with schema
                            if (isCoValue(initValue)) {
                                rawInit[key] = initValue.id;
                            } else {
                                throw new Error(
                                    `Expected covalue in ${String(
                                        key
                                    )} but got ${initValue}`
                                );
                            }
                        } else if (propertySignature) {
                            const schemaAtKey = Schema.make<
                                unknown,
                                JsonValue | undefined,
                                never
                            >(propertySignature.type);
                            rawInit[key] =
                                Schema.encodeSync(schemaAtKey)(initValue);
                        } else {
                            // TODO: check index signatures
                            throw new Error(`Key ${String(key)} not in schema`);
                        }
                    }

                this[rawSym] = rawOwner.createMap(rawInit);
            }

            this.id = this[rawSym].id as unknown as ID<this>;

            for (const propertySignature of struct.ast.propertySignatures) {
                const key = propertySignature.name;
                if (typeof key !== "string") continue;

                // TODO: deal with stuff like optional refs - by manually traversing the ast etc
                const fieldSchema = fields[key];
                if (fieldSchema && propertyIsCoValueSchema(fieldSchema)) {
                    Object.defineProperty(this, key, {
                        get(this: CoMapOfFields) {
                            const ref = this.meta.refs[key];
                            if (!ref) {
                                // TODO: check if this allowed to be undefined
                                return undefined;
                            }

                            const subScope = subscriptionsScopes.get(this);

                            subScope?.onRefAccessedOrSet(ref.id);

                            if (ref.value && subScope) {
                                subscriptionsScopes.set(ref.value, subScope);
                            }

                            return ref.value;
                        },
                        set(this: CoMapOfFields, value) {
                            this[rawSym].set(key, value.id);
                            subscriptionsScopes
                                .get(this)
                                ?.onRefAccessedOrSet(value.id);
                        },
                        enumerable: true,
                    });
                } else {
                    const schemaAtKey = Schema.make<
                        unknown,
                        JsonValue | undefined,
                        never
                    >(propertySignature.type);

                    Object.defineProperty(this, key, {
                        get(this: CoMapOfFields) {
                            return Schema.decodeSync(schemaAtKey)(
                                this[rawSym].get(key)
                            );
                        },
                        set(this: CoMapOfFields, value) {
                            this[rawSym].set(
                                key,
                                Schema.encodeSync(schemaAtKey)(value) as
                                    | JsonValue
                                    | undefined
                            );
                        },
                        enumerable: true,
                    });
                }
            }

            // TODO: deal with index signatures
            const keysThatAreRefs = Object.entries(fields)
                .filter(([_, value]) => isCoValueSchema(value))
                .map(([key]) => key);

            const refs = makeRefs<{
                [Key in keyof Fields]: Fields[Key] extends AnyCoValueSchema
                    ? Exclude<Schema.Schema.To<Fields[Key]>, undefined>
                    : never;
            }>(
                (key) => {
                    return this[rawSym].get(key as string) as
                        | ID<
                              Schema.Schema.To<
                                  Fields[typeof key] & AnyCoValueSchema
                              >
                          >
                        | undefined;
                },
                () => {
                    return keysThatAreRefs;
                },
                controlledAccountFromNode(this[rawSym].core.node),
                (key) => fields[key]!
            );

            Object.defineProperty(this, "meta", {
                value: {
                    loadedAs: controlledAccountFromNode(this[rawSym].core.node),
                    core: this[rawSym].core,
                    refs: refs,
                },
                enumerable: false,
            });

            if (struct.ast.indexSignatures.length > 0) {
            }
        }

        static loadEf(
            id: ID<CoMapOfFields>
        ): Effect.Effect<
            CoMapOfFields & CoMap<Fields>,
            UnavailableError,
            ControlledAccountCtx
        > {
            return Effect.gen(function* (_) {
                const controlledAccount = yield* _(ControlledAccountCtx);
                return yield* _(
                    new ValueRef(
                        id as ID<CoMapOfFields & CoMap<Fields>>,
                        controlledAccount,
                        CoMapOfFields as typeof CoMapOfFields &
                            CoMapSchema<CoMapOfFields, Fields>
                    ).loadEf()
                );
            });
        }

        static async load(
            id: ID<CoMapOfFields>,
            options: { as: ControlledAccount }
        ): Promise<(CoMapOfFields & CoMap<Fields>) | undefined> {
            const value = await new ValueRef(
                id as ID<CoMapOfFields & CoMap<Fields>>,
                options.as,
                CoMapOfFields as typeof CoMapOfFields &
                    CoMapSchema<CoMapOfFields, Fields>
            ).load();

            if (value === "unavailable") {
                return undefined;
            } else {
                return value;
            }
        }

        static subscribe(
            id: ID<CoMapOfFields>,
            options: { as: ControlledAccount },
            onUpdate: (value: CoMapOfFields & CoMap<Fields>) => void
        ): Promise<void> {
            return Effect.runPromise(
                Effect.provideService(
                    CoMapOfFields.subscribeEf(id).pipe(
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
        }

        static subscribeEf(
            id: ID<CoMapOfFields>
        ): Stream.Stream<
            CoMapOfFields & CoMap<Fields>,
            UnavailableError,
            ControlledAccountCtx
        > {
            return Stream.fromEffect(CoMapOfFields.loadEf(id)).pipe(
                Stream.flatMap((value) =>
                    Stream.asyncScoped<
                        CoMapOfFields & CoMap<Fields>,
                        UnavailableError
                    >((emit) =>
                        Effect.gen(function* (_) {
                            const subscription = new SubscriptionScope(
                                value,
                                CoMapOfFields as typeof CoMapOfFields &
                                    CoMapSchema<CoMap<Fields>, Fields>,
                                (update) => {
                                    void emit.single(update);
                                }
                            );

                            yield* _(
                                Effect.addFinalizer(() =>
                                    Effect.sync(() =>
                                        subscription.unsubscribeAll()
                                    )
                                )
                            );
                        })
                    )
                )
            );
        }

        toJSON() {
            return Object.fromEntries(
                Object.entries(this).flatMap(([key, value]) =>
                    typeof value === "object" && "toJSON" in value
                        ? [[key, value?.toJSON()]]
                        : [[key, value]]
                )
            );
        }

        [inspect]() {
            return this.toJSON();
        }

        static as<Self extends any>(): CoMapSchema<Self, Fields> {
            return CoMapOfFields as unknown as CoMapSchema<Self, Fields>;
        }
    }

    return CoMapOfFields as CoMapSchema<CoMap<Fields>, Fields> & {
        as<Self extends any>(): CoMapSchema<Self, Fields>;
    };
}
