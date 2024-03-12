import * as S from "@effect/schema/Schema";
import { RawGroup } from "cojson";
import {
    AnyCoValueSchema,
    CoValue,
    CoValueSchema,
} from "../../coValueInterfaces.js";
import { Schema } from "@effect/schema";

export interface Group<
    P extends AnyCoValueSchema | S.Schema<null> = S.Schema<null>,
    R extends AnyCoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValue<"Group", RawGroup> {
    profile: S.Schema.To<P>;
    root: S.Schema.To<R>;
}

export interface AnyGroupSchema<
    P extends AnyCoValueSchema | S.Schema<null>,
    R extends AnyCoValueSchema | S.Schema<null>,
> extends AnyCoValueSchema<"Group", Group<P, R>> {}

export interface GroupSchema<
    Self,
    P extends AnyCoValueSchema | S.Schema<null>,
    R extends AnyCoValueSchema | S.Schema<null>,
> extends CoValueSchema<
        Self,
        "Group",
        Group<P, R>,
        Schema.FromStruct<{
            profile: P;
            root: R;
        }>,
        never
    > {}
