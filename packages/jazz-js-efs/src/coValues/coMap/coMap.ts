import * as S from "@effect/schema/Schema";
import { Simplify } from "effect/Types";
import {
    CoValue,
    CoValueSchema,
    ID,
    valueOfSchemaSym,
} from "../../coValueInterfaces.js";
import { JsonValue, RawCoMap } from "cojson";
import { ValueRef } from "../../refs.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { Group } from "../group/group.js";
import {
    Account,
    ControlledAccount,
    ControlledAccountCtx,
} from "../account/account.js";
import { UnavailableError } from "../../errors.js";
import { Effect } from "effect";

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
    load(
        id: ID<CoMap<Fields>>,
        as: ControlledAccount
    ): Promise<CoMap<Fields> | "unavailable">;
    loadEf(
        id: ID<CoMap<Fields>>
    ): Effect.Effect<CoMap<Fields>, UnavailableError, ControlledAccountCtx>;
}

export type CoMapFields = {
    [key: string]: CoValueSchema | SchemaWithOutput<JsonValue>;
};

export type CoMapInit<Fields extends CoMapFields> = {
    [Key in keyof Fields]?: Fields[Key] extends CoValueSchema
        ? Fields[Key][valueOfSchemaSym]
        : S.Schema.To<Fields[Key]>;
};

export type CoMapMeta<Fields extends CoMapFields> = {
    readonly refs: {
        [Key in keyof Fields]: Fields[Key] extends CoValueSchema
            ? ValueRef<Fields[Key][valueOfSchemaSym]>
            : never;
    };
};
