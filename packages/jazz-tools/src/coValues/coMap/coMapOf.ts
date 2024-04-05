import {
    ID,
    isCoValueSchema,
    isCoValue,
    CoValue,
    inspect,
    CoValueSchema,
} from "../../coValueInterfaces.js";
import {
    CoMapFields,
    CoMapInit,
    CoMapSchema,
    CoMap,
    IndexSignature,
    CoMapBase,
    NoIndexSignature,
} from "./coMap.js";
import { ValueRef, makeRefs } from "../../refs.js";
import { JsonValue, RawAccount, RawCoMap, cojsonInternals } from "cojson";
import { AnyGroup } from "../group/group.js";
import { AnyAccount, ControlledAccount } from "../account/account.js";
import { Account, controlledAccountFromNode } from "../account/accountOf.js";
import { subscriptionsScopes } from "../../subscriptionScope.js";
import { AST, Schema } from "@effect/schema";
import {
    constructorOfSchemaSym,
    propertyIsCoValueSchema,
} from "../resolution.js";
import { JsonObject } from "cojson/src/jsonValue.js";
import { SharedCoValueConstructor } from "../construction.js";
import {
    PropertySignatureWithOutput,
    propSigToSchema,
} from "../../schemaHelpers.js";
import { pipeArguments } from "effect/Pipeable";
import { Group } from "../group/groupOf.js";

export function CoMapOf<
    Fields extends CoMapFields,
    IndexSig extends IndexSignature = NoIndexSignature,
>(fields: Fields, indexSignature?: IndexSig) {
    class CoMapOfFields
        extends SharedCoValueConstructor
        implements CoMapBase<Fields, IndexSig>
    {
        static get ast() {
            return AST.setAnnotation(
                Schema.instanceOf(this).ast,
                constructorOfSchemaSym,
                this
            );
        }
        static [Schema.TypeId]: Schema.Schema.Variance<
            CoMapOfFields,
            CoMapOfFields,
            never
        >[Schema.TypeId];
        static pipe() {
            // eslint-disable-next-line prefer-rest-params
            return pipeArguments(this, arguments);
        }
        static type = "CoMap" as const;

        id!: ID<this>;
        _type!: "CoMap";
        _owner!: AnyAccount | AnyGroup;
        _refs!: CoMapBase<Fields, IndexSig>["_refs"];
        _edits!: CoMapBase<Fields, IndexSig>["_edits"];
        _raw!: RawCoMap;
        _loadedAs!: ControlledAccount;
        _schema!: typeof CoMapOfFields;

        constructor(_init: undefined, options: { fromRaw: RawCoMap });
        constructor(
            init: CoMapInit<Fields>,
            options: { owner: AnyAccount | AnyGroup }
        );
        constructor(
            init: CoMapInit<Fields> | undefined,
            options: { owner: AnyAccount | AnyGroup } | { fromRaw: RawCoMap }
        ) {
            super();

            let raw: RawCoMap;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
            } else {
                const rawOwner = options.owner._raw;

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

                raw = rawOwner.createMap(rawInit);
            }

            for (const key of Object.keys(fields) as (keyof Fields)[]) {
                if (typeof key !== "string") continue;

                const fieldSchema = fields[key]!;
                if (propertyIsCoValueSchema(fieldSchema)) {
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
                    Object.defineProperty(this, key, {
                        get(this: CoMapOfFields) {
                            return this.getPrimitiveAtKey(key, fieldSchema);
                        },
                        set(this: CoMapOfFields, value) {
                            this.setPrimitiveAtKey(key, value, fieldSchema);
                        },
                        enumerable: true,
                    });
                }
            }

            const fieldsThatAreRefs = Object.entries(fields)
                .filter(([_, value]) => isCoValueSchema(value))
                .map(([key]) => key);

            const refs = makeRefs<
                {
                    [Key in keyof Fields]: Fields[Key] extends CoValueSchema
                        ? Exclude<Schema.Schema.To<Fields[Key]>, undefined>
                        : never;
                } & {
                    [Key in Schema.Schema.To<IndexSig["key"]>]: Exclude<
                        Schema.Schema.To<IndexSig["value"]>,
                        undefined
                    >;
                }
            >(
                (key) => {
                    return raw.get(key as string) as
                        | ID<
                              Schema.Schema.To<
                                  Fields[typeof key] & CoValueSchema
                              >
                          >
                        | undefined;
                },
                () => {
                    if (indexSignature) {
                        return raw
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
                controlledAccountFromNode(raw.core.node),
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

            const getEdits = () =>
                new Proxy(this, {
                    get(target, key, receiver) {
                        const schemaAtKey =
                            fields[key as keyof Fields] ||
                            (indexSignature &&
                            Schema.is(indexSignature?.key)(key)
                                ? indexSignature?.value
                                : undefined);
                        if (!schemaAtKey)
                            return Reflect.get(target, key, receiver);

                        const rawEdit = raw.lastEditAt(key as string);
                        if (!rawEdit) return undefined;

                        return {
                            get value() {
                                if (isCoValueSchema(schemaAtKey)) {
                                    return this.ref?.accessFrom(target);
                                } else {
                                    return (
                                        rawEdit?.value &&
                                        Schema.decodeSync(
                                            propSigToSchema(schemaAtKey)
                                        )(rawEdit?.value)
                                    );
                                }
                            },

                            get ref() {
                                if (isCoValueSchema(schemaAtKey)) {
                                    return (
                                        rawEdit?.value &&
                                        new ValueRef(
                                            rawEdit?.value as ID<CoValue>,
                                            target._loadedAs,
                                            schemaAtKey
                                        )
                                    );
                                }
                            },

                            get by() {
                                if (cojsonInternals.isAccountID(rawEdit.by)) {
                                    return new ValueRef(
                                        rawEdit.by as unknown as ID<AnyAccount>,
                                        target._loadedAs,
                                        Account
                                    ).accessFrom(target);
                                }
                            },

                            madeAt: rawEdit.at,
                            tx: rawEdit.tx,
                        };
                    },
                });

            Object.defineProperties(this, {
                id: {
                    value: raw.id as unknown as ID<
                        this & CoMap<Fields, IndexSig>
                    >,
                    enumerable: false,
                },
                _type: { value: "CoMap", enumerable: false },
                _owner: {
                    get: () =>
                        raw.group instanceof RawAccount
                            ? Account.fromRaw(raw.group)
                            : Group.fromRaw(raw.group),
                    enumerable: false,
                },
                _refs: { value: refs, enumerable: false },
                _edits: { get: getEdits, enumerable: false },
                _raw: { value: raw, enumerable: false },
                _loadedAs: {
                    get: () => controlledAccountFromNode(raw.core.node),
                    enumerable: false,
                },
                _schema: {
                    value: this.constructor,
                    enumerable: false,
                },
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
                        for (const key of target._raw.keys()) {
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
            return this._refs[key as keyof this["_refs"]]?.accessFrom(this);
        }

        private setCoValueAtKey(key: string, value: CoValue) {
            this._raw.set(key, value.id);
            subscriptionsScopes.get(this)?.onRefAccessedOrSet(value.id);
        }

        private getPrimitiveAtKey(
            key: string,
            schemaAtKey:
                | Schema.Schema<any, JsonValue | undefined, never>
                | PropertySignatureWithOutput<JsonValue | undefined>
        ) {
            return Schema.decodeSync(propSigToSchema(schemaAtKey))(
                this._raw.get(key)
            );
        }

        private setPrimitiveAtKey(
            key: string,
            value: any,
            schemaAtKey:
                | Schema.Schema<any, JsonValue | undefined, never>
                | PropertySignatureWithOutput<JsonValue | undefined>
        ) {
            this._raw.set(
                key,
                Schema.encodeSync(propSigToSchema(schemaAtKey))(value) as
                    | JsonValue
                    | undefined
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

        static as<SubClass>() {
            return CoMapOfFields as unknown as CoMapSchema<
                SubClass,
                Fields,
                IndexSig
            >;
        }
    }

    return CoMapOfFields as CoMapSchema<CoMapOfFields, Fields, IndexSig> & {
        as<SubClass>(): CoMapSchema<SubClass, Fields, IndexSig>;
    };
}
