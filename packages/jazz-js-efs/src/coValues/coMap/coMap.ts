import * as S from "@effect/schema/Schema";
import { Mutable, Simplify } from "effect/Types";
import { EnforceRawValueLikeSchema } from "../../rawValue.js";
import {
    CoValue,
    CoValueSchema,
    rawCoValueSym,
    valueOfSchemaSym,
} from "../../coValueInterfaces.js";
import { RawCoMap } from "cojson";
import { ValueRef } from "../../refs.js";

export type CoMap<Fields extends CoMapFields<Fields>> = {
    readonly id: `co_${string}`;
} & {
    [Key in keyof Fields]: Fields[Key] extends CoValueSchema
        ? Fields[Key][typeof valueOfSchemaSym] | undefined
        : Simplify<Mutable<S.Schema.To<Fields[Key]>>>;
} & CoValue<"CoMap", RawCoMap<RawFields<Fields>>>;

export interface CoMapConstructor<Fields extends CoMapFields<Fields>>
    extends S.Schema<
        Simplify<S.ToStruct<Fields>>,
        Simplify<S.FromStruct<Fields>>,
        never
    > {
    new (options: { fromRaw: RawCoMap }): CoMap<Fields>;
    new (owner: string, init: S.ToStruct<Fields>): CoMap<Fields>;
}

export type CoMapFields<
    Fields extends { [key: string]: S.Schema<any, any, never> | CoValueSchema },
> = {
    [Key in keyof Fields]: Fields[Key] extends CoValueSchema<infer _>
        ? Fields[Key]
        : EnforceRawValueLikeSchema<Fields[Key]>;
};

export type CoMapMeta<Fields extends CoMapFields<Fields>> = {
    readonly refs: {
        [Key in keyof Fields]: Fields[Key] extends CoValueSchema
            ? ValueRef<Fields[Key][typeof valueOfSchemaSym]>
            : never;
    };
};

export type RawFields<Fields extends CoMapFields<Fields>> = {
    [Key in keyof Fields]: Fields[Key] extends CoValueSchema
        ? Fields[Key][typeof valueOfSchemaSym][typeof rawCoValueSym]
        : S.Schema.From<Fields[Key]>;
};