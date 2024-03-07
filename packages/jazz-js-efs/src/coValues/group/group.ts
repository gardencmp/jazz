import * as S from "@effect/schema/Schema";
import { RawGroup } from "cojson";
import { CoValue, CoValueSchema } from "../../coValueInterfaces.js";

export interface Group<
    P extends CoValueSchema | S.Schema<null> = S.Schema<null>,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValue<"Group", RawGroup> {
    profile: S.Schema.To<P>;
    root: S.Schema.To<R>;
}

export interface GroupSchema<
    P extends CoValueSchema | S.Schema<null>,
    R extends CoValueSchema | S.Schema<null>,
> extends CoValueSchema<"Group", Group<P, R>> {}
