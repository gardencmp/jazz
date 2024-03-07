import { isTypeLiteral } from "@effect/schema/AST";
import * as S from "@effect/schema/Schema";
import { Simplify } from "effect/Types";
import {
    CoValueSchema,
    ID,
    schemaTagSym,
    tagSym,
    rawSym,
    isCoValueSchema,
    isCoValue,
    CoValue,
    inspect,
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
import { Effect, Scope, Sink, Stream } from "effect";
import { controlledAccountFromNode } from "../account/accountOf.js";
import { UnavailableError } from "../../errors.js";
import {
    SubscriptionScope,
    subscriptionsScopes,
} from "../../subscriptionScope.js";

export function CoMapOf<Fields extends CoMapFields>(
    fields: Fields
): CoMapSchema<Fields> {
    const struct = S.struct(fields) as S.Schema<
        Simplify<S.ToStruct<Fields>>,
        Simplify<S.FromStruct<Fields>>,
        never
    >;

    const CoMapOfFields: CoMapSchema<Fields> = class CoMapOfFields
        implements CoValue<"CoMap", RawCoMap>
    {
        static ast = struct.ast;
        static [S.TypeId] = struct[S.TypeId];
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
                    [key in Extract<keyof Fields, string>]:
                        | JsonValue
                        | undefined;
                };

                for (const key in init) {
                    const propertySignature =
                        struct.ast.propertySignatures.find(
                            (signature) => signature.name === key
                        );
                    const initValue = init[key];

                    if (isCoValueSchema(fields[key])) {
                        // TOOD: check for alignment of actual value with schema
                        if (isCoValue(initValue)) {
                            rawInit[key] = initValue.id;
                        } else {
                            throw new Error(
                                `Expected covalue in ${key} but got ${initValue}`
                            );
                        }
                    } else if (propertySignature) {
                        const schemaAtKey = S.make<
                            unknown,
                            JsonValue | undefined,
                            never
                        >(propertySignature.type);
                        rawInit[key] = S.encodeSync(schemaAtKey)(initValue);
                    } else {
                        // TODO: check index signatures
                        throw new Error(`Key ${key} not in schema`);
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
                if (isCoValueSchema(fieldSchema)) {
                    Object.defineProperty(this, key, {
                        get(this: CoMapOfFields) {
                            const ref = this.meta.refs[key];
                            if (!ref) {
                                throw new Error(
                                    "Expected ref for CoValueSchema field"
                                );
                            }

                            const subScope = subscriptionsScopes.get(this);

                            subScope?.onRefAccessedOrSet(
                                key,
                                ref.id,
                                fieldSchema
                            );

                            if (ref.value && subScope) {
                                subscriptionsScopes.set(ref.value, subScope);
                            }

                            return ref.value;
                        },
                        set(this: CoMapOfFields, value) {
                            this[rawSym].set(key, value.id);
                            subscriptionsScopes
                                .get(this)
                                ?.onRefAccessedOrSet(
                                    key,
                                    value.id,
                                    fieldSchema
                                );
                        },
                        enumerable: true,
                    });
                } else {
                    const schemaAtKey = S.make<
                        unknown,
                        JsonValue | undefined,
                        never
                    >(propertySignature.type);

                    Object.defineProperty(this, key, {
                        get(this: CoMapOfFields) {
                            return S.decodeSync(schemaAtKey)(
                                this[rawSym].get(key)
                            );
                        },
                        set(this: CoMapOfFields, value) {
                            this[rawSym].set(
                                key,
                                S.encodeSync(schemaAtKey)(value)
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
                [Key in keyof Fields]: Fields[Key] extends CoValueSchema
                    ? S.Schema.To<Fields[Key]>
                    : never;
            }>(
                (key) => {
                    return this[rawSym].get(key as string) as
                        | ID<S.Schema.To<Fields[typeof key] & CoValueSchema>>
                        | undefined;
                },
                () => {
                    return keysThatAreRefs;
                },
                controlledAccountFromNode(this[rawSym].core.node),
                (key) => fields[key]
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
                    new ValueRef(id, controlledAccount, CoMapOfFields).loadEf()
                );
            });
        }

        static load(
            id: ID<CoMapOfFields>,
            options: { as: ControlledAccount }
        ): Promise<(CoMapOfFields & CoMap<Fields>) | undefined> {
            return new ValueRef(id, options.as, CoMapOfFields).load();
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
                                CoMapOfFields,
                                (update) => {
                                    emit.single(update);
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
    };

    return CoMapOfFields;
}
