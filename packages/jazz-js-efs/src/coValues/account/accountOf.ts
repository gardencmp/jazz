import {
    AgentSecret,
    CoID,
    LocalNode,
    Peer,
    RawAccount,
    RawControlledAccount,
    SessionID,
} from "cojson";
import {
    CoValueSchema,
    ID,
    tagSym,
    rawSym,
    schemaTagSym,
} from "../../coValueInterfaces.js";
import { CoMapOf } from "../coMap/coMapOf.js";
import {
    Account,
    AccountSchema,
    ControlledAccount,
    ControlledAccountCtx,
    ProfileBaseSchema,
    controlledAccountSym,
} from "./account.js";
import * as S from "@effect/schema/Schema";
import { AccountMigration } from "./migration.js";
import { toJSON } from "effect/Inspectable";
import { ValueRef } from "../../refs.js";
import { UnavailableError } from "../../errors.js";
import { Effect } from "effect";

export function AccountOf<
    P extends ProfileBaseSchema = ProfileBaseSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
>(fields: { profile: P; root: R }): AccountSchema<P, R> {
    const struct = S.struct(fields);

    class AccountOfProfileAndRoot implements Account<P, R> {
        static ast = struct.ast;
        static [S.TypeId] = struct[S.TypeId];
        static pipe = struct.pipe;
        static [schemaTagSym] = "Account" as const;
        static [controlledAccountSym]: AccountOfProfileAndRoot &
            ControlledAccount<P, R>;

        [tagSym] = "Account" as const;
        [rawSym]: RawAccount | RawControlledAccount;
        id: ID<this>;
        isMe: boolean;

        get profile(): S.Schema.To<P> {
            const id = this[rawSym].get("profile");

            throw new Error("Not implemented");
        }

        get root(): S.Schema.To<R> {
            const id = this[rawSym].get("root");

            throw new Error("Not implemented");
        }

        constructor(
            init: Record<string, never>,
            options: Record<string, never>
        );
        constructor(
            init: undefined,
            options: { fromRaw: RawAccount | RawControlledAccount }
        );
        constructor(
            init: undefined | Record<string, never>,
            options:
                | { fromRaw: RawAccount | RawControlledAccount }
                | Record<string, never>
        ) {
            this[rawSym] = options.fromRaw;
            this.id = options.fromRaw.id as unknown as ID<this>;
            this.isMe =
                options.fromRaw.id == options.fromRaw.core.node.account.id;
        }

        static loadEf(
            id: ID<AccountOfProfileAndRoot>
        ): Effect.Effect<
            AccountOfProfileAndRoot,
            UnavailableError,
            ControlledAccountCtx
        > {
            return Effect.gen(function* (_) {
                const controlledAccount = yield* _(ControlledAccountCtx);
                return yield* _(
                    new ValueRef(
                        id,
                        controlledAccount,
                        AccountOfProfileAndRoot
                    ).loadEf()
                );
            });
        }

        static load(
            id: ID<AccountOfProfileAndRoot>,
            options: { as: ControlledAccount }
        ): Promise<AccountOfProfileAndRoot | undefined> {
            return new ValueRef(id, options.as, AccountOfProfileAndRoot).load();
        }

        static async create(options: {
            name: string;
            migration?: AccountMigration<AccountSchema<P, R>>;
            initialAgentSecret?: AgentSecret;
            peersToLoadFrom?: Peer[];
        }): Promise<AccountOfProfileAndRoot & ControlledAccount<P, R>> {
            const { node } = await LocalNode.withNewlyCreatedAccount({
                ...options,
                migration:
                    options.migration &&
                    (async (rawAccount) => {
                        const account = new AccountOfProfileAndRoot({
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
            migration?: AccountMigration<AccountSchema<P, R>>;
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

        toJSON() {
            return {
                id: this.id,
                profile: toJSON(this.profile),
                root: toJSON(this.root),
            };
        }
    }

    return AccountOfProfileAndRoot;
}

export class BaseProfile extends CoMapOf({ name: S.string }) {}

export class SimpleAccount extends AccountOf({
    profile: BaseProfile,
    root: S.null,
}) {}

export function controlledAccountFromNode(node: LocalNode) {
    if (!(node.account instanceof RawControlledAccount)) {
        throw new Error("Expected a controlled account");
    }
    return new SimpleAccount(undefined, {
        fromRaw: node.account,
    }) as SimpleAccount & ControlledAccount;
}
