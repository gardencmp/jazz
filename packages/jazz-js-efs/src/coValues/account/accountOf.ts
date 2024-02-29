import {
    AgentSecret,
    LocalNode,
    Peer,
    RawAccount,
    RawControlledAccount,
    SessionID,
} from "cojson";
import {
    CoValueSchema,
    ID,
    coValueSym,
    rawCoValueSym,
    schemaTagSym,
    valueOfSchemaSym,
} from "../../coValueInterfaces.js";
import { CoMapOf } from "../coMap/coMapOf.js";
import {
    Account,
    AccountConstructor,
    AccountSchema,
    ControlledAccount,
    ProfileBaseSchema,
    controlledAccountSym,
} from "./account.js";
import * as S from "@effect/schema/Schema";
import { AccountMigration } from "./migration.js";

export function AccountOf<
    P extends ProfileBaseSchema = ProfileBaseSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
>(fields: {
    profile: P;
    root: R;
}): AccountConstructor<P, R> & AccountSchema<P, R> {
    const struct = S.struct(fields);

    class AccountOfProfileAndRoot {
        static ast = struct.ast;
        static [S.TypeId] = struct[S.TypeId];
        static pipe = struct.pipe;
        static [schemaTagSym] = "Account" as const;
        static [valueOfSchemaSym]: AccountOfProfileAndRoot;
        static [controlledAccountSym]: AccountOfProfileAndRoot &
            ControlledAccount<P, R>;

        [coValueSym] = "Account" as const;
        [rawCoValueSym]: RawAccount | RawControlledAccount;
        id: ID<Account<P, R>>;
        isMe: boolean;

        get profile(): P extends CoValueSchema
            ? P[valueOfSchemaSym] | undefined
            : null {
            const id = this[rawCoValueSym].get("profile");

            if (!id) {
                return undefined;
            } else {
                // TODO
            }
        }

        get root(): R extends CoValueSchema
            ? R[valueOfSchemaSym] | undefined
            : null {
            const id = this[rawCoValueSym].get("root");

            if (!id) {
                return undefined;
            } else {
                // TODO
            }
        }

        constructor(options: { fromRaw: RawAccount | RawControlledAccount });
        constructor(options: { fromRaw: RawAccount | RawControlledAccount }) {
            this[rawCoValueSym] = options.fromRaw;
            this.id = options.fromRaw as unknown as ID<Account<P, R>>;
            this.isMe =
                options.fromRaw.id == options.fromRaw.core.node.account.id;
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

            return new AccountOfProfileAndRoot({
                fromRaw: node.account as RawControlledAccount,
            }) as AccountOfProfileAndRoot & ControlledAccount<P, R>;
        }

        static async load(options: {
            accountID: ID<Account<P, R>>;
            accountSecret: AgentSecret;
            sessionID: SessionID;
            peersToLoadFrom: Peer[];
            migration?: AccountMigration<AccountSchema<P, R>>;
        }): Promise<AccountOfProfileAndRoot & ControlledAccount<P, R>> {
            // TODO
        }
    }

    return AccountOfProfileAndRoot as typeof AccountOfProfileAndRoot &
        // TS infers Context<P> and Context<R> as unknown, even though they have to be never
        S.Schema<any, any, never>;
}

export const BaseProfile = CoMapOf({ name: S.string });

export const SimpleAccount = AccountOf({ profile: BaseProfile, root: S.null });
