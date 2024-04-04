import * as S from "@effect/schema/Schema";
import { Everyone, RawGroup, Role } from "cojson";
import { CoValue, CoValueSchema } from "../../coValueInterfaces.js";
import { ValueRef } from "../../refs.js";
import { AnyAccount } from "../account/account.js";

export interface AnyGroup<
    P extends CoValueSchema | S.Schema<null> = S.Schema<null>,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValue<"Group", RawGroup> {
    profile?: S.Schema.To<P>;
    root?: S.Schema.To<R>;
    _refs: {
        profile: ValueRef<S.Schema.To<P>>;
        root: ValueRef<S.Schema.To<R>>;
    };
    addMember(member: Everyone | AnyAccount, role: Role): this;
}

export interface GroupSchema<
    Self,
    P extends CoValueSchema | S.Schema<null>,
    R extends CoValueSchema | S.Schema<null>,
> extends CoValueSchema<Self, AnyGroup<P, R>, "Group", undefined> {
    new (options: { owner: AnyAccount | AnyGroup }): AnyGroup<P, R>;
}
