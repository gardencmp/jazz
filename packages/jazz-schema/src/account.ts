import {
    AgentSecret,
    Peer,
    SessionID,
    Account as RawAccount,
    ControlledAccount as RawControlledAccount,
} from "cojson";
import { AccountMigration, CoValue, CoValueClassBase, ID, NullSchema, Schema } from ".";
import { CoMapClass } from "./coMap.js";
import { Group } from "./group.js";

export interface Account<
    ProfileSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema,
    RootSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema
> extends Group<ProfileSchema, RootSchema> {
    _raw: RawAccount;
    id: ID<Account<ProfileSchema, RootSchema>>;

    isMe: boolean;
}

export interface AccountClass<
    ProfileSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema,
    RootSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema
> extends Schema<Account<ProfileSchema, RootSchema>>, CoValueClassBase {
    _Type: "account";
    _Profile: ProfileSchema;
    _Root: RootSchema;

    new (opts: { fromRaw: RawAccount | RawControlledAccount }): Account<ProfileSchema, RootSchema>;
    fromRaw(raw: RawAccount | RawControlledAccount, onGetRef?: (id: ID<CoValue>) => void): Account<ProfileSchema, RootSchema>;

    createControlledAccount<
        ProfileSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema,
        RootSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema
    >(opts: {
        name: string;
        migration?: AccountMigration<Account<ProfileSchema, RootSchema>>;
        initialAgentSecret?: AgentSecret;
        peersToLoadFrom?: Peer[];
    }): Promise<Account<ProfileSchema, RootSchema>>;

    loadControlledAccount<
        ProfileSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema,
        RootSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema
    >(opts: {
        accountID: ID<Account>;
        accountSecret: AgentSecret;
        sessionID: SessionID;
        peersToLoadFrom: Peer[];
        migration?: AccountMigration<Account<ProfileSchema, RootSchema>>;
    }): Promise<Account<ProfileSchema, RootSchema>>;
}

export function isAccountClass(value: any): value is Account {
    return (
        typeof value === "object" && value !== null && value._Type === "account"
    );
}

export function isAccount(value: any): value is Account {
    return isAccountClass(value) && "id" in value;
}

export function AccountWith<
    ProfileSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema,
    RootSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema
>(
    ProfileSchema: ProfileSchema,
    RootSchema: RootSchema
): AccountClass<ProfileSchema, RootSchema> {
    return class AccountClassForProfileAndRoot {
        static _Type = "account" as const;
        static _Profile = ProfileSchema;
        static _Root = RootSchema;
        static _Value: Account<ProfileSchema, RootSchema>;

        _raw: RawAccount;
        id: ID<Account<ProfileSchema, RootSchema>>;
        isMe: boolean;

        constructor(opts: { fromInner: RawAccount });
        constructor(opts: { fromInnerControlled: RawControlledAccount });
        constructor(opts: { fromInner: RawAccount } | { fromInnerControlled: RawControlledAccount }) {
            if ("fromInner" in opts) {
                this._raw = opts.fromInner;
            } else {
                this._raw = opts.fromInnerControlled;
            }
            this.id = this._raw.id as any;
            this.isMe = this._raw.id == this._raw.core.node.account.id
        }

        static createControlledAccount<
            ProfileSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema,
            RootSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema
        >(opts: {
            name: string;
            migration?: AccountMigration<Account<ProfileSchema, RootSchema>>;
            initialAgentSecret?: AgentSecret;
            peersToLoadFrom?: Peer[];
        }): Promise<Account<ProfileSchema, RootSchema>> {
            // TODO
        }

        static loadControlledAccount<
            ProfileSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema,
            RootSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema
        >(opts: {
            accountID: ID<Account>;
            accountSecret: AgentSecret;
            sessionID: SessionID;
            peersToLoadFrom: Peer[];
            migration?: AccountMigration<Account<ProfileSchema, RootSchema>>;
        }): Promise<Account<ProfileSchema, RootSchema>> {
            // TODO
        }

        get profile() {
            const id = this._raw.get("profile");

            if (!id) {
                return null;
            } else {
                // TODO
            }
        }

        get root() {
            const id = this._raw.get("root");

            if (!id) {
                return null;
            } else {
                // TODO
            }
        }
    } satisfies AccountClass<ProfileSchema, RootSchema>;
}
