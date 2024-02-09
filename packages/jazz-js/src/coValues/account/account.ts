import {
    AgentSecret,
    Peer,
    SessionID,
    RawAccount as RawAccount,
    RawControlledAccount as RawControlledAccount,
    InviteSecret,
} from "cojson";
import { AccountMigration, CoValueSchema } from "../../index.js";
import { ID } from "../../id.js";
import { CoValueBase, CoValueSchemaBase } from "../../baseInterfaces.js";
import { Schema } from "../../schema.js";
import { NullSchema } from "../../immutables/primitives.js";
import { CoMapSchema } from "../coMap/coMap.js";

/** @category CoValues - Account */
export interface Account<
    ProfileS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
> extends CoValueBase {
    /** @hidden */
    _raw: RawAccount | RawControlledAccount;
    /** @category Collaboration */
    id: ID<Account<ProfileS, RootS>>;
    /** @category Collaboration */
    isMe: boolean;
}

/** @category CoValues - Account */
export interface ControlledAccount<
    ProfileS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
> extends Account<ProfileS, RootS> {
    /** @hidden */
    _raw: RawControlledAccount;
    id: ID<ControlledAccount<ProfileS, RootS>>;
    isMe: true;
    acceptInvite<S extends CoValueSchema>(
        invitedObjectID: ID<S["_Value"]>,
        secret: InviteSecret,
        invitedObjectSchema: S
    ): Promise<S["_Value"] | undefined>;
}

/** @category CoValues - Account */
export interface AccountSchema<
    ProfileS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
> extends Schema<Account<ProfileS, RootS>>,
        CoValueSchemaBase<
            Account<ProfileS, RootS>,
            RawAccount | RawControlledAccount
        > {
    /** @category Type Hints */
    _Type: "account";
    /** @category Type Hints */
    _Profile: ProfileS;
    /** @category Type Hints */
    _Root: RootS;
    /** @category Type Hints */
    _RawValue: RawAccount | RawControlledAccount;

    /** @hidden */
    fromRaw(raw: RawAccount | RawControlledAccount): Account<ProfileS, RootS>;

    ControlledSchema: ControlledAccountSchema<ProfileS, RootS>;

    /** @category Creation */
    createControlledAccount(options: {
        name: string;
        migration?: AccountMigration<AccountSchema<ProfileS, RootS>>;
        initialAgentSecret?: AgentSecret;
        peersToLoadFrom?: Peer[];
    }): Promise<ControlledAccount<ProfileS, RootS>>;

    /** @category Creation */
    loadControlledAccount(options: {
        accountID: ID<Account>;
        accountSecret: AgentSecret;
        sessionID: SessionID;
        peersToLoadFrom: Peer[];
        migration?: AccountMigration<AccountSchema<ProfileS, RootS>>;
    }): Promise<ControlledAccount<ProfileS, RootS>>;
}

/** @hidden */
export interface ControlledAccountSchema<
    ProfileS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
> extends Schema<ControlledAccount<ProfileS, RootS>>,
        CoValueSchemaBase<
            ControlledAccount<ProfileS, RootS>,
            RawControlledAccount
        > {
    /** @category Type Hints */
    _Type: "account";
    /** @category Type Hints */
    _Profile: ProfileS;
    /** @category Type Hints */
    _Root: RootS;
    /** @category Type Hints */
    _RawValue: RawControlledAccount;
}


