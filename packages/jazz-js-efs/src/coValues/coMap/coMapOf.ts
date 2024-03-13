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
    CoMapFieldValue,
} from "./coMap.js";
import { makeRefs } from "../../refs.js";
import { JsonValue, RawCoMap } from "cojson";
import { Group } from "../group/group.js";
import { Account } from "../account/account.js";
import { controlledAccountFromNode } from "../account/accountOf.js";
import { subscriptionsScopes } from "../../subscriptionScope.js";
import { AST, Schema } from "@effect/schema";
import {
    constructorOfSchemaSym,
    propertyIsCoValueSchema,
} from "../resolution.js";
import { JsonObject } from "cojson/src/jsonValue.js";
import { SharedCoValueConstructor } from "../construction.js";

export function CoMapOf<
    Fields extends CoMapFields,
    IndexSignature extends {
        key: Schema.Schema<string>;
        value: CoMapFieldValue;
    },
>(fields: Fields, indexSignature?: IndexSignature) {
    const structSchema = Schema.struct(fields) as unknown as Schema.Schema<
        CoMapOfFields,
        Schema.FromStruct<Fields>,
        never
    >;
    const struct = indexSignature
        ? Schema.extend(structSchema)(
              Schema.record(indexSignature.key, indexSignature.value)
          )
        : structSchema;

    class CoMapOfFields
        extends SharedCoValueConstructor
        implements CoValue<"CoMap", RawCoMap>
    {
        static get ast() {
            return AST.setAnnotation(struct.ast, constructorOfSchemaSym, this);
        }
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
            super();

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
                        const initValue = init[key];
                        const field =
                            fields[key] ||
                            (indexSignature &&
                                Schema.is(indexSignature.key)(key) &&
                                indexSignature.value);

                        if (!field) {
                            throw new Error(`Key ${String(key)} not in schema`);
                        }

                        if (propertyIsCoValueSchema(field)) {
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
                        } else {
                            const fieldSchema = (
                                "propertySignatureAST" in field
                                    ? Schema.make<JsonObject, any, never>(
                                          (
                                              field.propertySignatureAST as {
                                                  from: AST.AST;
                                              }
                                          ).from
                                      )
                                    : field
                            ) as Schema.Schema<JsonObject, any, never>;
                            rawInit[key] =
                                Schema.encodeSync(fieldSchema)(initValue);
                        }
                    }

                this[rawSym] = rawOwner.createMap(rawInit);
            }

            this.id = this[rawSym].id as unknown as ID<this>;

            for (const propertySignature of struct.ast.propertySignatures) {
                const key = propertySignature.name;
                if (typeof key !== "string") continue;

                const fieldSchema = fields[key];
                if (fieldSchema && propertyIsCoValueSchema(fieldSchema)) {
                    Object.defineProperty(this, key, {
                        get(this: CoMapOfFields) {
                            return this.getCoValueAtKey(key);
                        },
                        set(this: CoMapOfFields, value) {
                            this.setCoValueAtKey(key, value);
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
                            return this.getPrimitiveAtKey(key, schemaAtKey);
                        },
                        set(this: CoMapOfFields, value) {
                            this.setPrimitiveAtKey(key, value, schemaAtKey);
                        },
                        enumerable: true,
                    });
                }
            }

            const fieldsThatAreRefs = Object.entries(fields)
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
                    if (indexSignature) {
                        return this[rawSym]
                            .keys()
                            .filter(
                                (key) =>
                                    fieldsThatAreRefs.includes(key) ||
                                    Schema.is(indexSignature.key)(key)
                            );
                    } else {
                        return fieldsThatAreRefs;
                    }
                },
                controlledAccountFromNode(this[rawSym].core.node),
                (key) =>
                    fields[key] ||
                    (indexSignature
                        ? indexSignature.value
                        : (() => {
                              throw new Error(
                                  "Expected " + String(key) + " to be valid"
                              );
                          })())
            );

            Object.defineProperty(this, "meta", {
                value: {
                    loadedAs: controlledAccountFromNode(this[rawSym].core.node),
                    core: this[rawSym].core,
                    refs: refs,
                },
                enumerable: false,
            });

            if (indexSignature) {
                return new Proxy(this, {
                    get(target, key) {
                        if (key in target) {
                            return Reflect.get(target, key);
                        } else {
                            if (Schema.is(indexSignature.key)(key as string)) {
                                if (
                                    propertyIsCoValueSchema(
                                        indexSignature.value
                                    )
                                ) {
                                    return target.getCoValueAtKey(
                                        key as string
                                    );
                                } else {
                                    return target.getPrimitiveAtKey(
                                        key as string,
                                        indexSignature.value
                                    );
                                }
                            } else {
                                throw new Error(
                                    "No such key " + String(key) + " in CoMap"
                                );
                            }
                        }
                    },
                    set(target, key, value) {
                        if (key in target) {
                            return Reflect.set(target, key, value);
                        } else if (
                            Schema.is(indexSignature.key)(key as string)
                        ) {
                            if (propertyIsCoValueSchema(indexSignature.value)) {
                                target.setCoValueAtKey(key as string, value);
                            } else {
                                target.setPrimitiveAtKey(
                                    key as string,
                                    value,
                                    indexSignature.value
                                );
                            }
                            return true;
                        } else {
                            throw new Error(
                                "No such key " + String(key) + " in CoMap"
                            );
                        }
                    },
                    ownKeys(target) {
                        const keys = Reflect.ownKeys(target);
                        for (const key of target[rawSym].keys()) {
                            if (!keys.includes(key)) {
                                if (
                                    Schema.is(indexSignature.key)(key as string)
                                ) {
                                    keys.push(key);
                                }
                            }
                        }
                        return keys;
                    },
                    getOwnPropertyDescriptor(target, key) {
                        if (key in target) {
                            return Reflect.getOwnPropertyDescriptor(
                                target,
                                key
                            );
                        } else if (
                            Schema.is(indexSignature.key)(key as string)
                        ) {
                            return {
                                enumerable: true,
                                configurable: true,
                            };
                        }
                    },
                });
            }
        }

        static fromRaw(raw: RawCoMap): CoMapOfFields {
            return new CoMapOfFields(undefined, { fromRaw: raw });
        }

        private getCoValueAtKey(key: string) {
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
        }

        private setCoValueAtKey(key: string, value: CoValue) {
            this[rawSym].set(key, value.id);
            subscriptionsScopes.get(this)?.onRefAccessedOrSet(value.id);
        }

        private getPrimitiveAtKey(
            key: string,
            schemaAtKey: Schema.Schema<any, JsonValue | undefined, never>
        ) {
            return Schema.decodeSync(schemaAtKey)(this[rawSym].get(key));
        }

        private setPrimitiveAtKey(
            key: string,
            value: any,
            schemaAtKey: Schema.Schema<any, JsonValue | undefined, never>
        ) {
            this[rawSym].set(
                key,
                Schema.encodeSync(schemaAtKey)(value) as JsonValue | undefined
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

        static as<Self extends any>(): CoMapSchema<
            Self,
            Fields,
            IndexSignature["key"],
            IndexSignature["value"]
        > {
            return CoMapOfFields as unknown as CoMapSchema<
                Self,
                Fields,
                IndexSignature["key"],
                IndexSignature["value"]
            >;
        }
    }

    return CoMapOfFields as CoMapSchema<
        CoMap<Fields, IndexSignature["key"], IndexSignature["value"]>,
        Fields,
        IndexSignature["key"],
        IndexSignature["value"]
    > & {
        as<Self extends any>(): CoMapSchema<
            Self,
            Fields,
            IndexSignature["key"],
            IndexSignature["value"]
        >;
    };
}
