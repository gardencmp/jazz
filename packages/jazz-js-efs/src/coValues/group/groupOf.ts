import { CoValueSchema } from "../../coValueInterfaces.js";
import { ProfileBaseSchema } from "../account/account.js";
import * as S from "@effect/schema/Schema";
import { GroupConstructor, GroupSchema } from "./group.js";

export function GroupOf<
    P extends ProfileBaseSchema | S.Schema<null> = S.Schema<null>,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
>(options: {
    profile: P;
    root: R;
}): GroupConstructor<P, R> & GroupSchema<P, R> {}

export const SimpleGroup = GroupOf({ profile: S.null, root: S.null });
