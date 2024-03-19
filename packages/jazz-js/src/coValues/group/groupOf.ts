import { CoValueSchema } from "../../coValueInterfaces.js";
import * as S from "@effect/schema/Schema";
import { GroupSchema } from "./group.js";
import { ProfileSchema } from "../account/account.js";

export function GroupOf<
    Self,
    P extends ProfileSchema | S.Schema<null>,
    R extends CoValueSchema | S.Schema<null>,
>(_options: { profile: P; root: R }): GroupSchema<Self, P, R> {}

export const SimpleGroup = GroupOf({ profile: S.null, root: S.null });
