import * as S from "@effect/schema/Schema";
import { CoValue, CoValueSchema, ID } from "../../coValueInterfaces.js";
import { CoValueCore, JsonValue, RawCoMap } from "cojson";
import { ValueRef } from "../../refs.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { ControlledAccount } from "../account/account.js";

export interface CoMapBase<Fields extends CoMapFields>
    extends CoValue<"CoMap", RawCoMap> {
    meta: CoMapMeta<Fields>;
}

export type CoMap<Fields extends CoMapFields> = {
    [Key in keyof Fields]: S.Schema.To<Fields[Key]>;
} & CoMapBase<Fields>;

export type CoMapSchema<Fields extends CoMapFields> = CoValueSchema<
    "CoMap",
    CoMap<Fields>,
    CoMapInit<Fields>
> &
    S.Schema<CoMap<Fields>, CoMap<Fields>, never>;

export type CoMapFields = {
    [key: string]: CoValueSchema | SchemaWithOutput<JsonValue>;
};

export type CoMapInit<Fields> = {
    [Key in keyof Fields]?: S.Schema.To<Fields[Key]>;
};

export type CoMapMeta<Fields extends CoMapFields> = {
    readonly loadedAs: ControlledAccount;
    readonly core: CoValueCore;
    readonly refs: {
        [Key in keyof Fields]: Fields[Key] extends CoValueSchema
            ? ValueRef<S.Schema.To<Fields[Key]>>
            : never;
    };
};
