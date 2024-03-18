import * as S from "@effect/schema/Schema";
import {
    AnyCoValueSchema,
    CoValue,
    ID,
    CoValueSchema,
} from "../../coValueInterfaces.js";
import { AnyCoMapSchema } from "../coMap/coMap.js";
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

export type AnyProfileSchema = AnyCoMapSchema<{
    name: S.Schema<string>;
}>;

export interface Account<
    P extends AnyProfileSchema = AnyProfileSchema,
    R extends AnyCoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValue<"Account", RawAccount> {
    profile: S.Schema.To<P>;
    root: S.Schema.To<R>;
    isMe: boolean;
}

export type ControlledAccount<
    P extends AnyProfileSchema = AnyProfileSchema,
    R extends AnyCoValueSchema | S.Schema<null> = S.Schema<null>,
> = Account<P, R> &
    CoValue<"Account", RawControlledAccount> & {
        isMe: true;

        acceptInvite<V extends AnyCoValueSchema>(
            valueID: ID<S.Schema.To<V>>,
            inviteSecret: InviteSecret,
            valueSchema: V
        ): Promise<V>;
    };

export interface AnyAccountSchema<
    P extends AnyProfileSchema = AnyProfileSchema,
    R extends AnyCoValueSchema | S.Schema<null> = S.Schema<null>,
> extends AnyCoValueSchema<
        "Account",
        Account<P, R>,
        Schema.FromStruct<{
            profile: P;
            root: R;
        }>,
        never
    > {
    readonly [controlledAccountSym]: ControlledAccount<P, R>;
}

export interface AccountSchema<
    Self = any,
    P extends AnyProfileSchema = AnyProfileSchema,
    R extends AnyCoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValueSchema<
        Self,
        "Account",
        Account<P, R>,
        Schema.FromStruct<{
            profile: P;
            root: R;
        }>,
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
