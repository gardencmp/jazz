import * as S from "@effect/schema/Schema";
import { RawGroup } from "cojson";
import {
    CoValue,
    CoValueSchema,
    valueOfSchemaSym,
} from "../../coValueInterfaces.js";
import { ControlledAccount } from "../account/controlledAccount.js";

export interface Group<
    P extends CoValueSchema | S.Schema<null> = S.Schema<null>,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValue<"Group", RawGroup> {
    profile: P extends CoValueSchema ? P[valueOfSchemaSym] : null;
    root: R extends CoValueSchema ? R[valueOfSchemaSym] : null;
}

export interface GroupSchema<
    P extends CoValueSchema | S.Schema<null>,
    R extends CoValueSchema | S.Schema<null>,
> extends CoValueSchema<"Group", Group<P, R>> {}

export interface GroupConstructor<
    P extends CoValueSchema | S.Schema<null>,
    R extends CoValueSchema | S.Schema<null>,
> {
    new (options: { fromRaw: RawGroup }): Group<P, R>;
    new (admin: ControlledAccount): Group<P, R>;
}
