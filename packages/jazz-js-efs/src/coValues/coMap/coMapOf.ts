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
} from "../../coValueInterfaces.js";
import {
    CoMapFields,
    CoMapConstructor,
    CoMap,
    CoMapMeta,
    RawFields,
} from "./coMap.js";
import { makeRefs } from "../../refs.js";
import { RawCoMap } from "cojson";

export function CoMapOf<Fields extends CoMapFields<Fields>>(
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
        [rawCoValueSym]: RawCoMap<RawFields<Fields>>;

        id: ID<this>;
        meta: CoMapMeta<Fields>;

        constructor(
            optionsOrOwner:
                | Account
                | Group
                | { fromRaw: RawCoMap<RawFields<Fields>> },
            init: CoMapInit<Fields>
        ) {
            if (!isTypeLiteral(struct.ast)) {
                throw new Error("CoMap AST must be type literal");
            }

            if ("fromRaw" in optionsOrOwner) {
                this[rawCoValueSym] = optionsOrOwner.fromRaw;
            } else {

            }

            for (const [key, propertySignature] of Object.entries(
                struct.ast.propertySignatures
            )) {
                const schemaAtKey = S.make(propertySignature.type);
                Object.defineProperty(this, key, {
                    get(this: CoMapForS) {
                        S.decodeSync(schemaAtKey)(this[rawCoValueSym].get(key));
                    },
                    set(this: CoMapForS, value) {
                        this[rawCoValueSym].set(key, S.encodeSync(schemaAtKey)(value));
                    },
                    enumerable: true,
                });
            }

            this.meta = {
                refs: makeRefs<{
                    [Key in keyof Fields]: Fields[Key] extends CoValueSchema
                        ? Fields[Key][typeof valueOfSchemaSym]
                        : never;
                }>(
                    (key) => {
                        throw new Error("Not implemented");
                    },
                    () => {
                        throw new Error("Not implemented");
                    }
                ),
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
