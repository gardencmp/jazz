import { AnyCoValueSchema } from "../../coValueInterfaces.js";
import * as S from "@effect/schema/Schema";
import { GroupSchema } from "./group.js";
import { AnyProfileSchema } from "../account/account.js";

export function GroupOf<
    P extends AnyProfileSchema | S.Schema<null>,
    R extends AnyCoValueSchema | S.Schema<null>,
>(_options: { profile: P; root: R }): GroupSchema<P, R> {
    // throw new Error("GroupOf not implemented");
}

export const SimpleGroup = GroupOf({ profile: S.null, root: S.null });
