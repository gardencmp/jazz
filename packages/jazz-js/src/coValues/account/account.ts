import * as S from "@effect/schema/Schema";
import {
    CoValue,
    ID,
    CoValueSchema,
    SubclassedConstructor,
} from "../../coValueInterfaces.js";
import { CoMap, CoMapSchema } from "../coMap/coMap.js";
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
import { ValueRef } from "../../refs.js";
import { SchemaWithInputAndOutput, SchemaWithOutput } from "../../schemaHelpers.js";

export type ProfileSchema = CoMapSchema<any, {
    name: S.Schema<string>
}> & SchemaWithInputAndOutput<CoMap<{
    name: S.Schema<string>
}>>;

export type RootSchema = CoValueSchema | S.Schema<null>;

export interface AnyAccount<
    P extends ProfileSchema = ProfileSchema,
    R extends RootSchema = RootSchema,
> extends CoValue<"Account", RawAccount> {
    profile?: S.Schema.To<P>;
    root?: S.Schema.To<R>;
    isMe: boolean;
    _refs: {
        profile: ValueRef<S.Schema.To<P>>;
        root: ValueRef<S.Schema.To<R>>;
    };
}

export function isAccount(value: CoValue): value is AnyAccount {
    return value._type === "Account";
}

export function isControlledAccount(
    value: CoValue
): value is ControlledAccount {
    return isAccount(value) && value.isMe;
}

export type ControlledAccount<
    P extends ProfileSchema = ProfileSchema,
    R extends RootSchema = RootSchema,
> = AnyAccount<P, R> &
    CoValue<"Account", RawControlledAccount> & {
        isMe: true;

        acceptInvite<V extends CoValueSchema>(
            valueID: ID<S.Schema.To<V>>,
            inviteSecret: InviteSecret,
            valueSchema: V
        ): Promise<S.Schema.To<V>>;

        sessionID: SessionID;
    };

export interface AccountSchema<
    Self = any,
    P extends ProfileSchema = ProfileSchema,
    R extends RootSchema = RootSchema,
> extends CoValueSchema<Self, AnyAccount<P, R>, "Account", undefined> {
    readonly [controlledAccountSym]: ControlledAccount<P, R>;

    create<A extends AnyAccount<P, R>>(
        this: SubclassedConstructor<A>,
        options: {
            name: string;
            migration?: AccountMigration<AccountSchema<AnyAccount<P, R>, P, R>>;
            initialAgentSecret?: AgentSecret;
            peersToLoadFrom?: Peer[];
        }
    ): Promise<ControlledAccount<P, R>>;

    become<A extends AnyAccount<P, R>>(
        this: SubclassedConstructor<A>,
        options: {
            accountID: ID<AnyAccount<P, R>>;
            accountSecret: AgentSecret;
            sessionID: SessionID;
            peersToLoadFrom: Peer[];
            migration?: AccountMigration<AccountSchema<AnyAccount<P, R>, P, R>>;
        }
    ): Promise<ControlledAccount<P, R>>;
}

export const controlledAccountSym = Symbol("@jazz/controlledAccount");
export type controlledAccountSym = typeof controlledAccountSym;

export class ControlledAccountCtx extends Context.Tag("ControlledAccount")<
    ControlledAccountCtx,
    ControlledAccount
>() {}
