import {
    AgentSecret,
    CoID,
    InviteSecret,
    LocalNode,
    Peer,
    RawAccount,
    RawCoValue,
    RawControlledAccount,
    SessionID,
} from "cojson";
import {
    ID,
    CoValueSchema,
    inspect,
    CoValueCo,
    CoValue,
} from "../../coValueInterfaces.js";
import { CoMapOf } from "../coMap/coMapOf.js";
import {
    Account,
    AccountSchema,
    ProfileSchema,
    ControlledAccount,
    controlledAccountSym,
} from "./account.js";
import * as S from "@effect/schema/Schema";
import { AccountMigration } from "./migration.js";
import { AST, Schema } from "@effect/schema";
import { Group } from "../group/group.js";
import { CoValueCoImpl, SharedCoValueConstructor } from "../construction.js";
import { constructorOfSchemaSym } from "../resolution.js";
import { pipeArguments } from "effect/Pipeable";
import { ValueRef } from "../../refs.js";

export function AccountOf<
    P extends ProfileSchema,
    R extends CoValueSchema | S.Schema<null>,
>(fields: { profile: P; root: R }) {
    class AccountOfProfileAndRoot
        extends SharedCoValueConstructor
        implements Account<P, R>
    {
        static get ast() {
            return AST.setAnnotation(
                Schema.instanceOf(this).ast,
                constructorOfSchemaSym,
                this
            );
        }
        static [Schema.TypeId]: Schema.Schema.Variance<
            Account<P, R> & AccountOfProfileAndRoot,
            Account<P, R> & AccountOfProfileAndRoot,
            never
        >[Schema.TypeId];
        static pipe() {
            // eslint-disable-next-line prefer-rest-params
            return pipeArguments(this, arguments);
        }
        static type = "Account" as const;
        static [controlledAccountSym]: AccountOfProfileAndRoot &
            ControlledAccount<P, R>;

        isMe: boolean;
        co: CoValueCo<"Account", this, RawAccount | RawControlledAccount> & {
            refs: {
                profile: ValueRef<S.Schema.To<P>>;
                root: ValueRef<S.Schema.To<R>>;
            };
            sessionID?: SessionID;
        };

        constructor(
            init: undefined,
            options: { owner: ControlledAccount | Group }
        );
        constructor(
            init: undefined,
            options: { fromRaw: RawAccount | RawControlledAccount }
        );
        constructor(
            init: undefined,
            options:
                | { fromRaw: RawAccount | RawControlledAccount }
                | { owner: ControlledAccount | Group }
        ) {
            super();
            if (!("fromRaw" in options)) {
                throw new Error(
                    "Can only construct account from raw or with .create()"
                );
            }
            this.isMe =
                options.fromRaw.id == options.fromRaw.core.node.account.id;

            const refs = {
                get profile() {
                    return new ValueRef(
                        options.fromRaw.id as unknown as ID<
                            Schema.Schema.To<P>
                        >,
                        controlledAccountFromNode(options.fromRaw.core.node),
                        fields.profile
                    );
                },
                get root() {
                    return new ValueRef(
                        options.fromRaw.id as unknown as ID<
                            Schema.Schema.To<R>
                        >,
                        controlledAccountFromNode(options.fromRaw.core.node),
                        fields.root
                    );
                },
            };

            this.co = new CoValueCoImpl(
                options.fromRaw.id as unknown as ID<this>,
                "Account",
                options.fromRaw,
                this.constructor as AccountSchema<this, P, R>,
                refs,
                this.isMe ? (this as ControlledAccount<P, R>) : undefined
            );

            if (this.isMe) {
                (this.co as unknown as ControlledAccount["co"]).sessionID =
                    options.fromRaw.core.node.currentSessionID;
            }
        }

        static fromRaw(raw: RawAccount | RawControlledAccount) {
            return new AccountOfProfileAndRoot(undefined, {
                fromRaw: raw,
            });
        }

        static async create(options: {
            name: string;
            migration?: AccountMigration<AccountSchema<Account<P, R>, P, R>>;
            initialAgentSecret?: AgentSecret;
            peersToLoadFrom?: Peer[];
        }): Promise<AccountOfProfileAndRoot & ControlledAccount<P, R>> {
            const { node } = await LocalNode.withNewlyCreatedAccount({
                ...options,
                migration:
                    options.migration &&
                    (async (rawAccount) => {
                        const account = new AccountOfProfileAndRoot(undefined, {
                            fromRaw: rawAccount,
                        }) as AccountOfProfileAndRoot & ControlledAccount<P, R>;

                        await options.migration!(account);
                    }),
            });

            return new AccountOfProfileAndRoot(undefined, {
                fromRaw: node.account as RawControlledAccount,
            }) as AccountOfProfileAndRoot & ControlledAccount<P, R>;
        }

        static async become(options: {
            accountID: ID<Account<P, R>>;
            accountSecret: AgentSecret;
            sessionID: SessionID;
            peersToLoadFrom: Peer[];
            migration?: AccountMigration<AccountSchema<Account<P, R>, P, R>>;
        }): Promise<AccountOfProfileAndRoot & ControlledAccount<P, R>> {
            const node = await LocalNode.withLoadedAccount({
                accountID: options.accountID as unknown as CoID<RawAccount>,
                accountSecret: options.accountSecret,
                sessionID: options.sessionID,
                peersToLoadFrom: options.peersToLoadFrom,
                migration:
                    options.migration &&
                    (async (rawAccount) => {
                        const account = new AccountOfProfileAndRoot(undefined, {
                            fromRaw: rawAccount,
                        }) as AccountOfProfileAndRoot & ControlledAccount<P, R>;

                        await options.migration!(account);
                    }),
            });

            return new AccountOfProfileAndRoot(undefined, {
                fromRaw: node.account as RawControlledAccount,
            }) as AccountOfProfileAndRoot & ControlledAccount<P, R>;
        }

        async acceptInvite<V extends CoValue>(
            valueID: ID<V>,
            inviteSecret: InviteSecret,
            valueSchema: CoValueSchema<V, V>
        ): Promise<V | undefined> {
            if (!this.isMe) {
                throw new Error("Only a controlled account can accept invites");
            }

            await (this.co.raw as RawControlledAccount).acceptInvite(
                valueID as unknown as CoID<RawCoValue>,
                inviteSecret
            );

            return valueSchema.load(valueID, { as: this as ControlledAccount });
        }

        get profile(): S.Schema.To<P> | undefined {
            return this.co.refs.profile.accessFrom(this);
        }

        get root(): S.Schema.To<R> | undefined {
            return this.co.refs.root.accessFrom(this);
        }

        toJSON() {
            return {
                co: {
                    id: this.co.id,
                    type: this.co.type,
                },
                profile: this.profile?.toJSON(),
                root: this.root?.toJSON(),
            };
        }

        [inspect]() {
            return this.toJSON();
        }
    }

    return AccountOfProfileAndRoot as AccountSchema<AccountOfProfileAndRoot & Account<P, R>, P, R>;
}

export class BaseProfile extends CoMapOf<BaseProfile>()({
    name: S.string,
}) {}

export class SimpleAccount extends AccountOf<
    typeof BaseProfile,
    Schema.Schema<null>
>({
    profile: BaseProfile,
    root: S.null,
}) {}

const simpleControlledAccounts = new WeakMap<
    RawControlledAccount,
    SimpleAccount & ControlledAccount
>();

export function controlledAccountFromNode(node: LocalNode) {
    if (!(node.account instanceof RawControlledAccount)) {
        throw new Error("Expected a controlled account");
    }
    let simpleAccount;

    if (simpleControlledAccounts.has(node.account)) {
        simpleAccount = simpleControlledAccounts.get(node.account);
    } else {
        simpleAccount = SimpleAccount.fromRaw(node.account) as SimpleAccount &
            ControlledAccount;
        simpleControlledAccounts.set(node.account, simpleAccount);
    }

    return simpleAccount!;
}
