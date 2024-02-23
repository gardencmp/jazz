import {
    AgentSecret,
    Peer,
    SessionID,
    RawAccount as RawAccount,
    RawControlledAccount as RawControlledAccount,
    LocalNode,
    CoID,
    InviteSecret,
    RawCoValue as RawCoValue,
} from "cojson";
import { AccountMigration } from "../../index.js";
import { ID } from "../../id.js";
import { CoValueSchemaBase } from "../../baseInterfaces.js";
import { NullSchema } from "../../immutables/primitives.js";
import { CoMapSchema } from "../coMap/coMap.js";
import { GroupMeta } from "../group/group.js";
import { Effect } from "effect";
import {
    CoValueUnavailableError,
    UnknownCoValueLoadError,
} from "../../errors.js";
import { AccountSchema, Account, ControlledAccount } from "./account.js";

/** @category CoValues - Account */

export function AccountWith<
    ProfileS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
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

        get profile(): ProfileS["_Value"] | undefined {
            const id = this._raw.get("profile");

            if (!id) {
                return null;
            } else {
                // TODO
            }
        }

        get root(): RootS["_Value"] | undefined {
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
            raw: RawControlledAccount
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
            id: ID<ControlledAccount<ProfileS, RootS>>
        ): Effect.Effect<
            ControlledAccount,
            CoValueUnavailableError | UnknownCoValueLoadError,
            ControlledAccount<ProfileS, RootS>
        > {
            throw new Error("Not implemented");
        }

        static subscribe(
            id: ID<ControlledAccount<ProfileS, RootS>>,
            { as }: { as: ControlledAccount },
            onUpdate: (value: ControlledAccount<ProfileS, RootS>) => void
        ): () => void {
            throw new Error("Not implemented");
        }

        static subscribeEf(
            id: ID<ControlledAccount<ProfileS, RootS>>
        ): Effect.Effect<
            ControlledAccount<ProfileS, RootS>,
            CoValueUnavailableError | UnknownCoValueLoadError,
            ControlledAccount
        > {
            throw new Error("Not implemented");
        }

        subscribe(onUpdate: (value: this) => void): () => void {
            throw new Error("Not implemented");
        }

        subscribeEf(): Effect.Effect<this, never, never> {
            throw new Error("Not implemented");
        }

        toJSON() {
            return {
                id: this.id,
                profile: this.profile?.toJSON(),
                root: this.root?.toJSON(),
            };
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
            raw: RawAccount | RawControlledAccount
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
            id: ID<ControlledAccount<ProfileS, RootS>>
        ): Effect.Effect<
            ControlledAccount,
            CoValueUnavailableError | UnknownCoValueLoadError,
            ControlledAccount<ProfileS, RootS>
        > {
            throw new Error("Not implemented");
        }

        static subscribe(
            id: ID<ControlledAccount<ProfileS, RootS>>,
            { as }: { as: ControlledAccount },
            onUpdate: (value: ControlledAccount<ProfileS, RootS>) => void
        ): () => void {
            throw new Error("Not implemented");
        }

        static subscribeEf(
            id: ID<ControlledAccount<ProfileS, RootS>>
        ): Effect.Effect<
            ControlledAccount<ProfileS, RootS>,
            CoValueUnavailableError | UnknownCoValueLoadError,
            ControlledAccount
        > {
            throw new Error("Not implemented");
        }

        subscribe(onUpdate: (value: this) => void): () => void {
            throw new Error("Not implemented");
        }

        subscribeEf(): Effect.Effect<this, never, never> {
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

        toJSON() {
            return {
                id: this.id,
                profile: this.profile?.toJSON(),
                root: this.root?.toJSON(),
            };
        }

        static ControlledSchema = ControlledAccountSchemaForProfileAndRoot;
    }

    return NonControlledAccountSchemaForProfileAndRoot;
}
