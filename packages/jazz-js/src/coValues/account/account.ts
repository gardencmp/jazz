import * as S from "@effect/schema/Schema";
import {
    CoValue,
    ID,
    CoValueSchema,
} from "../../coValueInterfaces.js";
import { CoMapSchema } from "../coMap/coMap.js";
import {
    AgentSecret,
    InviteSecret,
    Peer,
    RawAccount,
    RawControlledAccount,
    SessionID,
} from "cojson";
import { AccountMigration } from "./migration.js";
import { Context } from "effect";
import { Schema } from "@effect/schema";

export type ProfileSchema = CoMapSchema<any, {
    name: S.Schema<string>;
}>;

export interface Account<
    P extends ProfileSchema = ProfileSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValue<"Account", RawAccount> {
    profile: S.Schema.To<P>;
    root: S.Schema.To<R>;
    isMe: boolean;
}

export type ControlledAccount<
    P extends ProfileSchema = ProfileSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> = Account<P, R> &
    CoValue<"Account", RawControlledAccount> & {
        isMe: true;

        acceptInvite<V extends CoValueSchema>(
            valueID: ID<S.Schema.To<V>>,
            inviteSecret: InviteSecret,
            valueSchema: V
        ): Promise<V>;

        co: Account['co'] & {
            sessionID: SessionID;
        }
    };


export interface AccountSchema<
    Self = any,
    P extends ProfileSchema = ProfileSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValueSchema<
        Self,
        Account<P, R>,
        "Account",
        never
    > {
    readonly [controlledAccountSym]: ControlledAccount<P, R>;

    new (init: undefined, options: { fromRaw: RawAccount }): Account<P, R>;

    create(options: {
        name: string;
        migration?: AccountMigration<AccountSchema<Self, P, R>>;
        initialAgentSecret?: AgentSecret;
        peersToLoadFrom?: Peer[];
    }): Promise<ControlledAccount<P, R>>;

    become(options: {
        accountID: ID<Account<P, R>>;
        accountSecret: AgentSecret;
        sessionID: SessionID;
        peersToLoadFrom: Peer[];
        migration?: AccountMigration<AccountSchema<Self, P, R>>;
    }): Promise<ControlledAccount<P, R>>;
}

export const controlledAccountSym = Symbol("@jazz/controlledAccount");
export type controlledAccountSym = typeof controlledAccountSym;

export class ControlledAccountCtx extends Context.Tag("ControlledAccount")<
    ControlledAccountCtx,
    ControlledAccount
>() {}
