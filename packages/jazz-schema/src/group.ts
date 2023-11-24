import { Account, ControlledAccount, Group, ProfileMeta } from "cojson";
import { ID, NativeCoValue, NullSchema, StringSchema, SyncState } from ".";
import { CoMapSchema } from "./coMap.js";

export type ProfileSchema = CoMapSchema<{ name: StringSchema }>;

export class GroupSchema<
    Profile extends ProfileSchema = ProfileSchema,
    Root extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> extends CoMapSchema<{ profile: Profile; root: Root }> {
    readonly _profile!: Profile;
    readonly _root!: Root;
}

export type GroupValue<
    Profile extends ProfileSchema = ProfileSchema,
    Root extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> = {
    _type: "group";
    _inner: Group<NativeCoValue<Profile, ProfileMeta>, NativeCoValue<Root>>;

    id: ID<GroupValue<Profile, Root>>;

    profile: Profile["_value"];
    root: Root["_value"];

    sync: SyncState & {
        profile: SyncState;
    };
};

export type GroupClass<
    Profile extends ProfileSchema = ProfileSchema,
    Root extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> = {
    new (options: {
        admin: ControlledAccountValue;
        createProfile?: (group: GroupValue) => Profile["_value"];
        createRoot?: (group: GroupValue) => Root["_value"];
    }): GroupValue<Profile, Root>;
};

export class AccountSchema<
    Profile extends ProfileSchema = ProfileSchema,
    Root extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> extends GroupSchema<Profile, Root> {}

export type AccountValue<
    Profile extends ProfileSchema = ProfileSchema,
    Root extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> = GroupValue<Profile, Root> & {
    _type: "account";
    _inner: Account<NativeCoValue<Profile, ProfileMeta>, NativeCoValue<Root>>;
    id: ID<AccountValue<Profile, Root>>;
    isMe: boolean;
};

export type ControlledAccountValue<
    Profile extends ProfileSchema = ProfileSchema,
    Root extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> = GroupValue<Profile, Root> & {
    _type: "account";
    _inner: Account<NativeCoValue<Profile, ProfileMeta>, NativeCoValue<Root>>;
    id: ID<AccountValue<Profile, Root>>;
    isMe: boolean;
};

export type AccountClass<
    Profile extends ProfileSchema = ProfileSchema,
    Root extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> = {
    fromInner(nativeAccount: Account<NativeCoValue<Profile, ProfileMeta>, NativeCoValue<Root>>) : AccountValue<Profile, Root>;
    fromControlledInner(nativeAccount: ControlledAccount<NativeCoValue<Profile, ProfileMeta>, NativeCoValue<Root>>) : ControlledAccountValue<Profile, Root>;
};