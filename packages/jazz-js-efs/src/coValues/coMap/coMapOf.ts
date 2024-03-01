import { isTypeLiteral } from "@effect/schema/AST";
import * as S from "@effect/schema/Schema";
import { Simplify } from "effect/Types";
import {
    CoValueSchema,
    ID,
    schemaTagSym,
    coValueSym,
    valueOfSchemaSym,
    rawCoValueSym,
    isCoValueSchema,
    isCoValue,
    CoMapInit,
} from "../../coValueInterfaces.js";
import { CoMapFields, CoMapConstructor, CoMap, CoMapMeta } from "./coMap.js";
import { ValueRef, makeRefs } from "../../refs.js";
import { CoID, JsonValue, RawCoMap, RawCoValue, RawControlledAccount } from "cojson";
import { Group } from "../group/group.js";
import {
    Account,
    ControlledAccount,
    ControlledAccountCtx,
} from "../account/account.js";
import { Effect } from "effect";
import { AST } from "@effect/schema";
import { SimpleAccount, controlledAccountFromNode } from "../account/accountOf.js";
import { UnavailableError } from "../../errors.js";

export function CoMapOf<Fields extends CoMapFields>(
    fields: Fields
): CoMapConstructor<Fields> & CoValueSchema<"CoMap", CoMap<Fields>> {
    const struct = S.struct(fields) as S.Schema<
        Simplify<S.ToStruct<Fields>>,
        Simplify<S.FromStruct<Fields>>,
        never
    >;

    class CoMapOfFields {
        static ast = struct.ast;
        static [S.TypeId] = struct[S.TypeId];
        static pipe = struct.pipe;
        static [schemaTagSym] = "CoMap" as const;
        static [valueOfSchemaSym]: CoMap<Fields>;

        [coValueSym] = "CoMap" as const;
        [rawCoValueSym]: RawCoMap;

        id: ID<this>;
        meta: CoMapMeta<Fields>;

        constructor(_init: undefined, options: { fromRaw: RawCoMap });
        constructor(init: CoMapInit<Fields>, options: {owner: Account | Group}, );
        constructor(
            init: CoMapInit<Fields> | undefined,
            options: {owner: Account | Group} | { fromRaw: RawCoMap },
        ) {
            if (!isTypeLiteral(struct.ast)) {
                throw new Error("CoMap AST must be type literal");
            }

            if ("fromRaw" in options) {
                this[rawCoValueSym] = options.fromRaw;
            } else {
                const rawOwner = options.owner[rawCoValueSym];

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

                this[rawCoValueSym] = rawOwner.createMap(rawInit);
            }

            this.id = this[rawCoValueSym].id as unknown as ID<this>;

            for (const propertySignature of struct.ast.propertySignatures) {
                const key = propertySignature.name;
                if (typeof key !== "string") continue;

                // TODO: deal with stuff like optional refs - by manually traversing the ast etc
                if (isCoValueSchema(fields[key])) {
                    Object.defineProperty(this, key, {
                        get(this: CoMapOfFields) {
                            return this.meta.refs[key]?.value;
                        },
                        set(this: CoMapOfFields, value) {
                            this[rawCoValueSym].set(key, value.id);
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
                                this[rawCoValueSym].get(key)
                            );
                        },
                        set(this: CoMapOfFields, value) {
                            this[rawCoValueSym].set(
                                key,
                                S.encodeSync(schemaAtKey)(value)
                            );
                        },
                        enumerable: true,
                    });
                }
            }

            // TODO: deal with index signatures
            const keysWithIds = Object.entries(fields).filter(([key, value]) => isCoValueSchema(value)).map(([key]) => key);

            const refs = makeRefs<{
                [Key in keyof Fields]: Fields[Key] extends CoValueSchema
                    ? Fields[Key][valueOfSchemaSym]
                    : never;
            }>(
                (key) => {
                    return this[rawCoValueSym].get(key as string) as ID<(Fields[typeof key] & CoValueSchema)[valueOfSchemaSym]> | undefined;
                },
                () => {
                    return keysWithIds;
                },
                controlledAccountFromNode(this[rawCoValueSym].core.node),
                (key) => fields[key]
            );

            this.meta = {
                refs: refs,
            };

            if (struct.ast.indexSignatures.length > 0) {
            }
        }

        static loadEf(
            id: ID<CoMapOfFields>
        ): Effect.Effect<CoMapOfFields, UnavailableError, ControlledAccountCtx> {
            return Effect.gen(function* (_) {
                const controlledAccount = yield* _(ControlledAccountCtx);
                return yield* _(new ValueRef(id, controlledAccount, CoMapOfFields).loadEf())
            })
        }

        static load(
            id: ID<CoMapOfFields>,
            options: {as: ControlledAccount}
        ): Promise<CoMapOfFields | "unavailable"> {
            return new ValueRef(id, options.as, CoMapOfFields).load();
        }
    }

    return CoMapOfFields as typeof CoMapOfFields &
        CoMapConstructor<Fields> satisfies CoValueSchema<
        "CoMap",
        CoMap<Fields>
    >;
}
