import { LocalNode } from "cojson";
import type {
    AgentSecret,
    CoID,
    InviteSecret,
    Peer,
    RawAccount,
    RawCoMap,
    RawCoValue,
    RawControlledAccount,
    SessionID,
} from "cojson";
import { Context } from "effect";
import type {
    CoMap,
    CoValue,
    CoValueClass,
    FieldDescriptor,
    Group,
    ID,
    RefField,
    SubclassedConstructor,
    UnavailableError,
} from "../internal.js";
import { CoValueBase, Profile, ValueRef, inspect } from "../internal.js";
import type { Stream } from "effect/Stream";

export class Account<
        Def extends { profile: Profile | null; root: CoMap | null } = {
            profile: Profile | null;
            root: CoMap | null;
        },
    >
    extends CoValueBase
    implements CoValue<"Account", RawAccount | RawControlledAccount>
{
    id!: ID<this>;
    _type!: "Account";
    _raw!: RawAccount | RawControlledAccount;

    static _schema: any;
    get _schema(): {
        profile: FieldDescriptor;
        root: FieldDescriptor;
    } {
        return (this.constructor as typeof Account)._schema;
    }
    static {
        this._schema = {
            profile: { ref: () => Profile },
            root: { json: true },
        } as any;
    }

    get _owner(): Account {
        return this as Account;
    }
    get _loadedAs(): Account & Me {
        return this.isMe
            ? (this as Account & Me)
            : Account.fromNode(this._raw.core.node);
    }

    profile!: NonNullable<Def["profile"]> | null;
    root!: NonNullable<Def["root"]> | null;

    get _refs(): {
        profile: NonNullable<Def["profile"]> extends Profile
            ? ValueRef<NonNullable<Def["profile"]>> | null
            : null;
        root: NonNullable<Def["root"]> extends CoMap
            ? ValueRef<NonNullable<Def["root"]>> | null
            : null;
    } {
        const profileID = this._raw.get("profile") as unknown as ID<
            NonNullable<Def["profile"]>
        > | undefined;
        const rootID = this._raw.get("root") as unknown as
            | ID<NonNullable<Def["root"]>>
            | undefined;
        return {
            profile: profileID && (new ValueRef(
                profileID,
                this._loadedAs,
                (
                    this._schema.profile as RefField<
                        NonNullable<Def["profile"]> & CoValue
                    >
                ).ref()
            )) as any,
            root:
                rootID &&
                (new ValueRef(
                    rootID,
                    this._loadedAs,
                    (
                        this._schema.root as RefField<NonNullable<Def["root"]> & CoValue>
                    ).ref()
                ) as any),
        };
    }

    isMe: boolean;
    sessionID: SessionID | undefined;

    constructor(init: undefined, options: { owner: Group | Account });
    constructor(
        init: undefined,
        options: { fromRaw: RawAccount | RawControlledAccount }
    );
    constructor(
        init: undefined,
        options:
            | { fromRaw: RawAccount | RawControlledAccount }
            | { owner: Group | Account }
    ) {
        super();
        if (!("fromRaw" in options)) {
            throw new Error(
                "Can only construct account from raw or with .create()"
            );
        }
        this.isMe = options.fromRaw.id == options.fromRaw.core.node.account.id;

        Object.defineProperties(this, {
            id: {
                value: options.fromRaw.id,
                enumerable: false,
            },
            _raw: { value: options.fromRaw, enumerable: false },
            profile: {
                get: () => {
                    const ref = this._refs.profile;
                    return ref ? ref.accessFrom(this) : (undefined as any);
                },
                set: (value: Def["profile"] | null) => {
                    if (value) {
                        this._raw.set(
                            "profile",
                            value.id as unknown as CoID<RawCoMap>
                        );
                    }
                },
            },
            root: {
                get: () => {
                    const ref = this._refs.root;
                    return ref ? ref.accessFrom(this) : (undefined as any);
                },
                set: (value: Def["root"] | null) => {
                    if (value) {
                        this._raw.set(
                            "root",
                            value.id as unknown as CoID<RawCoMap>
                        );
                    }
                },
            },
        });

        if (this.isMe) {
            (this as Account & Me).sessionID =
                options.fromRaw.core.node.currentSessionID;
        }
    }

    myRole(): "admin" | undefined {
        if (this.isMe) {
            return "admin";
        }
    }

    acceptInvite:
        | (<V extends CoValue>(
              valueID: ID<V>,
              inviteSecret: InviteSecret,
              coValueClass: CoValueClass<V>
          ) => Promise<V | undefined>)
        | undefined = (async <V extends CoValue>(
        valueID: ID<V>,
        inviteSecret: InviteSecret,
        coValueClass: CoValueClass<V>
    ) => {
        if (!this.isMe) {
            throw new Error("Only a controlled account can accept invites");
        }

        await (this._raw as RawControlledAccount).acceptInvite(
            valueID as unknown as CoID<RawCoValue>,
            inviteSecret
        );

        return coValueClass.load(valueID, {
            as: this as Account & Me,
        });
    }) as any;

    static async create<A extends Account>(
        this: SubclassedConstructor<A> & typeof Account,
        options: {
            name: string;
            initialAgentSecret?: AgentSecret;
            peersToLoadFrom?: Peer[];
        }
    ): Promise<A & Me> {
        const { node } = await LocalNode.withNewlyCreatedAccount({
            ...options,
            migration: async (rawAccount) => {
                const account = new this(undefined, {
                    fromRaw: rawAccount,
                }) as A & Me;

                await account.migrate?.();
            },
        });

        return this.fromNode(node) as A & Me;
    }

    static async become<A extends Account>(
        this: SubclassedConstructor<A> & typeof Account,
        options: {
            accountID: ID<Account>;
            accountSecret: AgentSecret;
            sessionID: SessionID;
            peersToLoadFrom: Peer[];
        }
    ): Promise<A & Me> {
        const node = await LocalNode.withLoadedAccount({
            accountID: options.accountID as unknown as CoID<RawAccount>,
            accountSecret: options.accountSecret,
            sessionID: options.sessionID,
            peersToLoadFrom: options.peersToLoadFrom,
            migration: async (rawAccount) => {
                const account = new this(undefined, {
                    fromRaw: rawAccount,
                }) as A & Me;

                await account.migrate?.();
            },
        });

        return this.fromNode(node) as A & Me;
    }

    static fromNode<A extends Account>(
        this: SubclassedConstructor<A>,
        node: LocalNode
    ): A & Me {
        return new this(undefined, {
            fromRaw: node.account as RawControlledAccount,
        }) as A & Me;
    }

    toJSON(): object | any[] {
        return {
            id: this.id,
            _type: this._type,
        };
    }

    [inspect]() {
        return this.toJSON();
    }

    static encoding<V extends Account>(
        this: { new (...args: any[]): V } & CoValueClass<V> & { _schema: any },
        fields: {
            profile: V["_schema"]["profile"];
            root: V["_schema"]["root"];
        }
    ) {
        this._schema ||= {};
        Object.assign(this._schema, fields);
    }

    migrate: (() => void | Promise<void>) | undefined;
}

export interface Me {
    id: ID<any>;
    isMe: true;
    _raw: RawControlledAccount;
    sessionID: SessionID;
    subscribe(listener: (update: this & Me) => void): () => void;
    subscribeEf(): Stream<this & Me, UnavailableError, never>;
    acceptInvite: (...args: any[]) => any;
}

export class AccountCtx extends Context.Tag("Account")<
    AccountCtx,
    Account & Me
>() {}

export function isControlledAccount(account: Account): account is Account & Me {
    return account.isMe;
}
