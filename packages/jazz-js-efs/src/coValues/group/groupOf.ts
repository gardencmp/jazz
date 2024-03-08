import { CoValueSchema } from "../../coValueInterfaces.js";
import { ProfileBaseSchema } from "../account/account.js";
import * as S from "@effect/schema/Schema";
import { GroupSchema } from "./group.js";

export function GroupOf<
    P extends ProfileBaseSchema | S.Schema<null> = S.Schema<null>,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
>(_options: { profile: P; root: R }): GroupSchema<P, R> {
    // throw new Error("GroupOf not implemented");
}

export const SimpleGroup = GroupOf({ profile: S.null, root: S.null });
