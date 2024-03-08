import * as S from "@effect/schema/Schema";
import { CoValue, CoValueSchema, ID } from "../../coValueInterfaces.js";
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

export interface Account<
    P extends ProfileBaseSchema = ProfileBaseSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValue<"Account", RawAccount> {
    profile: S.Schema.To<P>;
    root: S.Schema.To<R>;
    isMe: boolean;
}

export type ControlledAccount<
    P extends ProfileBaseSchema = ProfileBaseSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> = Account<P, R> &
    CoValue<"Account", RawControlledAccount> & {
        isMe: true;
    };

export interface AccountSchema<
    P extends ProfileBaseSchema = ProfileBaseSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValueSchema<
        "Account",
        Account<P, R>,
        never
    > {
    readonly [controlledAccountSym]: ControlledAccount<P, R>;

    new (init: undefined, options: { fromRaw: RawAccount }): Account<P, R>;

    create(options: {
        name: string;
        migration?: AccountMigration<AccountSchema<P, R>>;
        initialAgentSecret?: AgentSecret;
        peersToLoadFrom?: Peer[];
    }): Promise<ControlledAccount<P, R>>;

    become(options: {
        accountID: ID<Account<P, R>>;
        accountSecret: AgentSecret;
        sessionID: SessionID;
        peersToLoadFrom: Peer[];
        migration?: AccountMigration<AccountSchema<P, R>>;
    }): Promise<ControlledAccount<P, R>>;
}

export const controlledAccountSym = Symbol("@jazz/controlledAccount");
export type controlledAccountSym = typeof controlledAccountSym;

export class ControlledAccountCtx extends Context.Tag("ControlledAccount")<
    ControlledAccountCtx,
    ControlledAccount
>() {}
