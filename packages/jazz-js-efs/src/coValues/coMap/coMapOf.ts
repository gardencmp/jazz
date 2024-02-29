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
import { JsonValue, RawCoMap } from "cojson";
import { Group } from "../group/group.js";
import { Account } from "../account/account.js";

export function CoMapOf<Fields extends CoMapFields>(
    fields: Fields
): CoMapConstructor<Fields> & CoValueSchema<"CoMap", CoMap<Fields>> {
    const struct = S.struct(fields) as S.Schema<
        Simplify<S.ToStruct<Fields>>,
        Simplify<S.FromStruct<Fields>>,
        never
    >;

    class CoMapForS {
        static ast = struct.ast;
        static [S.TypeId] = struct[S.TypeId];
        static pipe = struct.pipe;
        static [schemaTagSym] = "CoMap" as const;
        static [valueOfSchemaSym]: CoMap<Fields>;

        [coValueSym] = "CoMap" as const;
        [rawCoValueSym]: RawCoMap;

        id: ID<this>;
        meta: CoMapMeta<Fields>;

        constructor(
            optionsOrOwner: Account | Group | { fromRaw: RawCoMap },
            init: CoMapInit<Fields>
        ) {
            if (!isTypeLiteral(struct.ast)) {
                throw new Error("CoMap AST must be type literal");
            }

            if ("fromRaw" in optionsOrOwner) {
                this[rawCoValueSym] = optionsOrOwner.fromRaw;
            } else {
                const rawOwner = optionsOrOwner[rawCoValueSym];

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

                    if (isCoValueSchema(propertySignature)) {
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
                const schemaAtKey = S.make<
                    unknown,
                    JsonValue | undefined,
                    never
                >(propertySignature.type);

                Object.defineProperty(this, key, {
                    get(this: CoMapForS) {
                        return S.decodeSync(schemaAtKey)(this[rawCoValueSym].get(key));
                    },
                    set(this: CoMapForS, value) {
                        this[rawCoValueSym].set(
                            key,
                            S.encodeSync(schemaAtKey)(value)
                        );
                    },
                    enumerable: true,
                });
            }

            const refs = makeRefs<{
                [Key in keyof Fields]: Fields[Key] extends CoValueSchema
                    ? ValueRef<Fields[Key][typeof valueOfSchemaSym]>
                    : never;
            }>(
                (key) => {
                    throw new Error("Not implemented");
                },
                () => {
                    throw new Error("Not implemented");
                }
            );

            this.meta = {
                refs: refs,
            };

            if (struct.ast.indexSignatures.length > 0) {
            }
        }
    }

    return CoMapForS as typeof CoMapForS &
        CoMapConstructor<Fields> satisfies CoValueSchema<
        "CoMap",
        CoMap<Fields>
    >;
}
