import {
    AgentSecret,
    Peer,
    SessionID,
    Account as RawAccount,
    ControlledAccount as RawControlledAccount,
    LocalNode,
    CoID,
    InviteSecret,
    CoValue as RawCoValue,
} from "cojson";
import {
    AccountMigration,
    BinaryCoStream,
    CoValue,
    CoValueBase,
    CoValueSchema,
    CoValueSchemaBase,
    ID,
} from "./index.js";
import { Schema } from "./schema.js";
import { NullSchema, imm } from "./primitives.js";
import { CoMapOf, CoMapSchema } from "./coMap.js";
import { Group, GroupMeta } from "./group.js";
import { Effect } from "effect";
import { CoValueUnavailableError, UnknownCoValueLoadError } from "./errors.js";

/** @category CoValues - Account */
export interface Account<
    ProfileS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> {
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
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
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
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
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
    fromRaw(
        raw: RawAccount | RawControlledAccount,
        onGetRef?: (id: ID<CoValue>) => void
    ): Account<ProfileS, RootS>;

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
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
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

/** @category CoValues - Account */
export function isAccountSchema(value: unknown): value is Account {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "account"
    );
}

/** @category CoValues - Account */
export function isAccount(value: unknown): value is Account {
    return (
        typeof value === "object" &&
        value !== null &&
        isAccountSchema(value.constructor) &&
        "id" in value
    );
}

/** @category CoValues - Account */
export function AccountWith<
    ProfileS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
>(ProfileS: ProfileS, RootS: RootS): AccountSchema<ProfileS, RootS> {
    abstract class AccountSchemaForProfileAndRoot {
        static _Type = "account" as const;
        static _Profile = ProfileS;
        static _Root = RootS;
        static _Value: Account<ProfileS, RootS>;
        static _RawValue: RawAccount | RawControlledAccount;

        _raw!: RawAccount | RawControlledAccount;
        id!: ID<Account<ProfileS, RootS>>;
        isMe!: boolean;
        meta!: GroupMeta<ProfileS, RootS>;

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
    }

    class ControlledAccountSchemaForProfileAndRoot extends AccountSchemaForProfileAndRoot {
        static _Value: ControlledAccount<ProfileS, RootS>;
        static _RawValue: RawControlledAccount;
        _raw: RawControlledAccount;
        id: ID<ControlledAccount<ProfileS, RootS>>;
        isMe: true;

        constructor(options: { fromRaw: RawControlledAccount });
        constructor(options: { fromRaw: RawControlledAccount }) {
            super();
            this._raw = options.fromRaw;
            if (this._raw.id !== this._raw.core.node.account.id)
                throw new Error("This account is not a controlled account");
            this.id = this._raw.id as unknown as ID<
                ControlledAccount<ProfileS, RootS>
            >;
            this.isMe = true;
            this.meta = new GroupMeta(this._raw);
        }

        static fromRaw(
            raw: RawControlledAccount,
            _onGetRef?: (id: ID<CoValue>) => void
        ): ControlledAccount<ProfileS, RootS> {
            return new ControlledAccountSchemaForProfileAndRoot({
                fromRaw: raw,
            });
        }

        static load(
            id: ID<ControlledAccount<ProfileS, RootS>>,
            { as }: { as: ControlledAccount }
        ): Promise<ControlledAccount<ProfileS, RootS>> {
            throw new Error("Not implemented");
        }

        static loadEf(
            id: ID<ControlledAccount<ProfileS, RootS>>,
        ): Effect.Effect<
            ControlledAccount,
            CoValueUnavailableError | UnknownCoValueLoadError,
            ControlledAccount<ProfileS, RootS>
        > {
            throw new Error("Not implemented");
        }

        async acceptInvite<S extends CoValueSchemaBase>(
            invitedObjectID: ID<S["_Value"]>,
            secret: InviteSecret,
            invitedObjectSchema: S
        ): Promise<S["_Value"] | undefined> {
            const rawAccount = this._raw;

            await rawAccount.acceptInvite(
                invitedObjectID as unknown as CoID<RawCoValue>,
                secret
            );

            return invitedObjectSchema.load(invitedObjectID, { as: this });
        }
    }

    class NonControlledAccountSchemaForProfileAndRoot extends AccountSchemaForProfileAndRoot {
        constructor(options: { fromRaw: RawAccount | RawControlledAccount });
        constructor(options: { fromRaw: RawAccount | RawControlledAccount }) {
            super();
            this._raw = options.fromRaw;
            this.id = this._raw.id as unknown as ID<Account<ProfileS, RootS>>;
            this.isMe = this._raw.id == this._raw.core.node.account.id;
            this.meta = new GroupMeta(this._raw);
        }

        static fromRaw(
            raw: RawAccount | RawControlledAccount,
            _onGetRef?: (id: ID<CoValue>) => void
        ): Account<ProfileS, RootS> {
            return new NonControlledAccountSchemaForProfileAndRoot({
                fromRaw: raw,
            });
        }

        static load(
            id: ID<ControlledAccount<ProfileS, RootS>>,
            { as }: { as: ControlledAccount }
        ): Promise<ControlledAccount<ProfileS, RootS>> {
            throw new Error("Not implemented");
        }

        static loadEf(
            id: ID<ControlledAccount<ProfileS, RootS>>,
        ): Effect.Effect<
            ControlledAccount,
            CoValueUnavailableError | UnknownCoValueLoadError,
            ControlledAccount<ProfileS, RootS>
        > {
            throw new Error("Not implemented");
        }

        static async createControlledAccount(options: {
            name: string;
            migration?: AccountMigration<AccountSchema<ProfileS, RootS>>;
            initialAgentSecret?: AgentSecret;
            peersToLoadFrom?: Peer[];
        }): Promise<ControlledAccount<ProfileS, RootS>> {
            const { node } = await LocalNode.withNewlyCreatedAccount({
                name: options.name,
                initialAgentSecret: options.initialAgentSecret,
                peersToLoadFrom: options.peersToLoadFrom,
                migration:
                    options.migration &&
                    (async (rawAccount) => {
                        const account =
                            ControlledAccountSchemaForProfileAndRoot.fromRaw(
                                rawAccount
                            );

                        await options.migration!(account);
                    }),
            });

            return ControlledAccountSchemaForProfileAndRoot.fromRaw(
                node.account as RawControlledAccount
            );
        }

        static async loadControlledAccount(options: {
            accountID: ID<Account>;
            accountSecret: AgentSecret;
            sessionID: SessionID;
            peersToLoadFrom: Peer[];
            migration?: AccountMigration<AccountSchema<ProfileS, RootS>>;
        }): Promise<ControlledAccount<ProfileS, RootS>> {
            const node = await LocalNode.withLoadedAccount({
                accountID: options.accountID as unknown as CoID<RawAccount>,
                accountSecret: options.accountSecret,
                sessionID: options.sessionID,
                peersToLoadFrom: options.peersToLoadFrom,
                migration:
                    options.migration &&
                    (async (rawAccount) => {
                        const account =
                            ControlledAccountSchemaForProfileAndRoot.fromRaw(
                                rawAccount
                            );

                        await options.migration!(account);
                    }),
            });

            return ControlledAccountSchemaForProfileAndRoot.fromRaw(
                node.account as RawControlledAccount
            );
        }

        static ControlledSchema = ControlledAccountSchemaForProfileAndRoot;
    }

    return NonControlledAccountSchemaForProfileAndRoot;
}

/** @category CoValues - Account */
export const SimpleAccount = AccountWith(
    CoMapOf({
        name: imm.string,
    }),
    imm.null
);
