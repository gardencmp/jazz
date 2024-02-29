import * as S from "@effect/schema/Schema";
import { Simplify } from "effect/Types";
import {
    CoValue,
    CoValueSchema,
    valueOfSchemaSym,
} from "../../coValueInterfaces.js";
import { JsonValue, RawCoMap } from "cojson";
import { ValueRef } from "../../refs.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { Group } from "../group/group.js";
import { Account } from "../account/account.js";

export type CoMap<Fields extends CoMapFields> = {
    [Key in keyof Fields]: Fields[Key] extends CoValueSchema
        ? Fields[Key][valueOfSchemaSym] | undefined
        : S.Schema.To<Fields[Key]>;
} & {
    meta: CoMapMeta<Fields>;
} & CoValue<"CoMap", RawCoMap>;

export type CoMapSchema<Fields extends CoMapFields> = CoValueSchema<
    "CoMap",
    CoMap<Fields>
>;

export interface CoMapConstructor<Fields extends CoMapFields> {
    new (options: { fromRaw: RawCoMap }): CoMap<Fields>;
    new (owner: Account | Group, init: CoMapInit<Fields>): CoMap<Fields>;
}

export type CoMapFields = {
    [key: string]: CoValueSchema | SchemaWithOutput<JsonValue>;
};

export type CoMapInit<Fields extends CoMapFields> = {
    [Key in keyof Fields]?: Fields[Key] extends CoValueSchema
        ? Fields[Key][valueOfSchemaSym]
        : S.Schema.From<Fields[Key]>;
};

export type CoMapMeta<Fields extends CoMapFields> = {
    readonly refs: {
        [Key in keyof Fields]: Fields[Key] extends CoValueSchema
            ? ValueRef<Fields[Key][valueOfSchemaSym]>
            : never;
    };
};
