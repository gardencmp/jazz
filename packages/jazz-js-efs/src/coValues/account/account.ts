import * as S from "@effect/schema/Schema";
import {
    CoValue,
    CoValueSchema,
    ID,
    valueOfSchemaSym,
} from "../../coValueInterfaces.js";
import { CoMapSchema } from "../coMap/coMap.js";
import {
    AgentSecret,
    Peer,
    RawAccount,
    RawControlledAccount,
    SessionID,
} from "cojson";
import { AccountMigration } from "./migration.js";
import { Context } from "effect";

export type ProfileBaseSchema = CoMapSchema<{
    name: S.Schema<string>;
}>;

export type Account<
    P extends ProfileBaseSchema = ProfileBaseSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> = {
    profile: P extends CoValueSchema ? P[valueOfSchemaSym] | undefined : null;
    root: R extends CoValueSchema ? R[valueOfSchemaSym] | undefined : null;
    isMe: boolean;
} & CoValue<"Account", RawAccount>;

export type ControlledAccount<
    P extends ProfileBaseSchema = ProfileBaseSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> = Account<P, R> &
    CoValue<"Account", RawControlledAccount> & {
        isMe: true;
    };

export interface AccountConstructor<
    P extends ProfileBaseSchema = ProfileBaseSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> {
    new (options: {
        fromRaw: RawAccount;
    }): Account<P, R>;

    create(options: {
        name: string;
        migration?: AccountMigration<AccountSchema<P, R>>;
        initialAgentSecret?: AgentSecret;
        peersToLoadFrom?: Peer[];
    }): Promise<ControlledAccount<P, R>>;

    load(options: {
        accountID: ID<Account<P, R>>;
        accountSecret: AgentSecret;
        sessionID: SessionID;
        peersToLoadFrom: Peer[];
        migration?: AccountMigration<AccountSchema<P, R>>;
    }): Promise<ControlledAccount<P, R>>;
}

export const controlledAccountSym = Symbol("@jazz/controlledAccount");
export type controlledAccountSym = typeof controlledAccountSym;

export interface AccountSchema<
    P extends ProfileBaseSchema = ProfileBaseSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValueSchema<"Account", Account<P, R> | ControlledAccount<P, R>> {
    readonly [controlledAccountSym]: ControlledAccount<P, R>;
}

export class ControlledAccountCtx extends Context.Tag("ControlledAccount")<
    ControlledAccountCtx,
    ControlledAccount
>() {}
