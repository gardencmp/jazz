import { CoValue, CoValueSchema } from "../../coValueInterfaces.js";
import { CoValueCore, JsonValue, RawCoMap } from "cojson";
import { ValueRef } from "../../refs.js";
import {
    PropertySignatureWithInput,
    SchemaWithOutput,
} from "../../schemaHelpers.js";
import { ControlledAccount } from "../account/account.js";
import { Schema } from "@effect/schema";

export interface CoMapBase<Fields extends CoMapFields>
    extends CoValue<"CoMap", RawCoMap> {
    meta: CoMapMeta<Fields>;
}

export type CoMap<Fields extends CoMapFields> = {
    [Key in keyof Fields]: Schema.Schema.To<Fields[Key]>;
} & CoMapBase<Fields>;

export interface CoMapSchema<Fields extends CoMapFields> extends CoValueSchema<
    "CoMap",
    CoMap<Fields>,
    Schema.FromStruct<Fields>,
    CoMapInit<Fields>
> {}

export type CoMapFields = {
    [key: string]:
        | CoValueSchema
        | SchemaWithOutput<JsonValue>
        | PropertySignatureWithInput<CoValue>;
};

export type CoMapInit<Fields extends CoMapFields> = Schema.ToStruct<Fields>;

export type CoMapMeta<Fields extends CoMapFields> = {
    readonly loadedAs: ControlledAccount;
    readonly core: CoValueCore;
    readonly refs: {
        [Key in keyof Fields]: Fields[Key] extends CoValueSchema
            ? ValueRef<Schema.Schema.To<Fields[Key]>>
            : never;
    };
};
