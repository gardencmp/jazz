import {
  AgentSecret,
  CoID,
  CryptoProvider,
  InviteSecret,
  LocalNode,
  Peer,
  RawAccount,
  RawCoMap,
  RawCoValue,
  RawControlledAccount,
  SessionID,
  cojsonInternals,
} from "cojson";
import {
  AnonymousJazzAgent,
  CoMap,
  type CoValue,
  CoValueBase,
  CoValueClass,
  DeeplyLoaded,
  DepthsIn,
  Group,
  ID,
  MembersSym,
  Profile,
  Ref,
  type RefEncoded,
  RefIfCoValue,
  type Schema,
  SchemaInit,
  ensureCoValueLoaded,
  inspect,
  loadCoValue,
  subscribeToCoValue,
  subscribeToExistingCoValue,
  subscriptionsScopes,
} from "../internal.js";
import { coValuesCache } from "../lib/cache.js";

/** @category Identity & Permissions */
export class Account extends CoValueBase implements CoValue {
  declare id: ID<this>;
  declare _type: "Account";
  declare _raw: RawAccount | RawControlledAccount;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _schema: any;
  get _schema(): {
    profile: Schema;
    root: Schema;
  } {
    return (this.constructor as typeof Account)._schema;
  }
  static {
    this._schema = {
      profile: {
        ref: () => Profile,
        optional: false,
      } satisfies RefEncoded<Profile>,
      root: {
        ref: () => CoMap,
        optional: true,
      } satisfies RefEncoded<CoMap>,
    };
  }

  get _owner(): Account {
    return this as Account;
  }
  get _loadedAs(): Account | AnonymousJazzAgent {
    if (this.isMe) return this;

    const rawAccount = this._raw.core.node.account;

    if (rawAccount instanceof RawAccount) {
      return coValuesCache.get(rawAccount, () => Account.fromRaw(rawAccount));
    }

    return new AnonymousJazzAgent(this._raw.core.node);
  }

  declare profile: Profile | null;
  declare root: CoMap | null;

  get _refs(): {
    profile: RefIfCoValue<Profile> | undefined;
    root: RefIfCoValue<CoMap> | undefined;
  } {
    const profileID = this._raw.get("profile") as unknown as
      | ID<NonNullable<this["profile"]>>
      | undefined;
    const rootID = this._raw.get("root") as unknown as
      | ID<NonNullable<this["root"]>>
      | undefined;

    return {
      profile:
        profileID &&
        (new Ref(
          profileID,
          this._loadedAs,
          this._schema.profile as RefEncoded<
            NonNullable<this["profile"]> & CoValue
          >,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any as RefIfCoValue<this["profile"]>),
      root:
        rootID &&
        (new Ref(
          rootID,
          this._loadedAs,
          this._schema.root as RefEncoded<NonNullable<this["root"]> & CoValue>,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any as RefIfCoValue<this["root"]>),
    };
  }

  isMe: boolean;
  sessionID: SessionID | undefined;

  constructor(options: { fromRaw: RawAccount | RawControlledAccount }) {
    super();
    if (!("fromRaw" in options)) {
      throw new Error("Can only construct account from raw or with .create()");
    }
    this.isMe = options.fromRaw.id == options.fromRaw.core.node.account.id;

    Object.defineProperties(this, {
      id: {
        value: options.fromRaw.id,
        enumerable: false,
      },
      _raw: { value: options.fromRaw, enumerable: false },
      _type: { value: "Account", enumerable: false },
    });

    if (this.isMe) {
      this.sessionID = options.fromRaw.core.node.currentSessionID;
    }

    return new Proxy(this, AccountAndGroupProxyHandler as ProxyHandler<this>);
  }

  myRole(): "admin" | undefined {
    if (this.isMe) {
      return "admin";
    }
  }

  async acceptInvite<V extends CoValue>(
    valueID: ID<V>,
    inviteSecret: InviteSecret,
    coValueClass: CoValueClass<V>,
  ) {
    if (!this.isMe) {
      throw new Error("Only a controlled account can accept invites");
    }

    await (this._raw as RawControlledAccount).acceptInvite(
      valueID as unknown as CoID<RawCoValue>,
      inviteSecret,
    );

    return loadCoValue(coValueClass, valueID, this as Account, []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }

  /** @private */
  static async create<A extends Account>(
    this: CoValueClass<A> & typeof Account,
    options: {
      creationProps: { name: string };
      initialAgentSecret?: AgentSecret;
      peersToLoadFrom?: Peer[];
      crypto: CryptoProvider;
    },
  ): Promise<A> {
    const { node } = await LocalNode.withNewlyCreatedAccount({
      ...options,
      migration: async (rawAccount, _node, creationProps) => {
        const account = new this({
          fromRaw: rawAccount,
        }) as A;

        await account.migrate?.(creationProps);
      },
    });

    return this.fromNode(node) as A;
  }

  static async createAs<A extends Account>(
    this: CoValueClass<A> & typeof Account,
    as: Account,
    options: {
      creationProps: { name: string };
    },
  ) {
    // TODO: is there a cleaner way to do this?
    const connectedPeers = cojsonInternals.connectedPeers(
      "creatingAccount",
      "createdAccount",
      { peer1role: "server", peer2role: "client" },
    );

    as._raw.core.node.syncManager.addPeer(connectedPeers[1]);

    return this.create<A>({
      creationProps: options.creationProps,
      crypto: as._raw.core.node.crypto,
      peersToLoadFrom: [connectedPeers[0]],
    });
  }

  static fromNode<A extends Account>(
    this: CoValueClass<A>,
    node: LocalNode,
  ): A {
    return new this({
      fromRaw: node.account as RawControlledAccount,
    }) as A;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toJSON(): object | any[] {
    return {
      id: this.id,
      _type: this._type,
    };
  }

  [inspect]() {
    return this.toJSON();
  }

  migrate(
    this: Account,
    creationProps?: { name: string },
  ): void | Promise<void> {
    if (creationProps) {
      const profileGroup = Group.create({ owner: this });
      profileGroup.addMember("everyone", "reader");
      this.profile = Profile.create(
        { name: creationProps.name },
        { owner: profileGroup },
      );
    }
  }

  /** @category Subscription & Loading */
  static load<A extends Account, Depth>(
    this: CoValueClass<A>,
    id: ID<A>,
    as: Account,
    depth: Depth & DepthsIn<A>,
  ): Promise<DeeplyLoaded<A, Depth> | undefined> {
    return loadCoValue(this, id, as, depth);
  }

  /** @category Subscription & Loading */
  static subscribe<A extends Account, Depth>(
    this: CoValueClass<A>,
    id: ID<A>,
    as: Account,
    depth: Depth & DepthsIn<A>,
    listener: (value: DeeplyLoaded<A, Depth>) => void,
  ): () => void {
    return subscribeToCoValue<A, Depth>(this, id, as, depth, listener);
  }

  /** @category Subscription & Loading */
  ensureLoaded<A extends Account, Depth>(
    this: A,
    depth: Depth & DepthsIn<A>,
  ): Promise<DeeplyLoaded<A, Depth> | undefined> {
    return ensureCoValueLoaded(this, depth);
  }

  /** @category Subscription & Loading */
  subscribe<A extends Account, Depth>(
    this: A,
    depth: Depth & DepthsIn<A>,
    listener: (value: DeeplyLoaded<A, Depth>) => void,
  ): () => void {
    return subscribeToExistingCoValue(this, depth, listener);
  }
}

export const AccountAndGroupProxyHandler: ProxyHandler<Account | Group> = {
  get(target, key, receiver) {
    if (key === "profile") {
      const ref = target._refs.profile;
      return ref
        ? ref.accessFrom(receiver, "profile")
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (undefined as any);
    } else if (key === "root") {
      const ref = target._refs.root;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ref ? ref.accessFrom(receiver, "root") : (undefined as any);
    } else {
      return Reflect.get(target, key, receiver);
    }
  },
  set(target, key, value, receiver) {
    if (
      (key === "profile" || key === "root" || key === MembersSym) &&
      typeof value === "object" &&
      SchemaInit in value
    ) {
      (target.constructor as typeof CoMap)._schema ||= {};
      (target.constructor as typeof CoMap)._schema[key] = value[SchemaInit];
      return true;
    } else if (key === "profile") {
      if (value) {
        target._raw.set(
          "profile",
          value.id as unknown as CoID<RawCoMap>,
          "trusting",
        );
      }
      subscriptionsScopes
        .get(receiver)
        ?.onRefAccessedOrSet(target.id, value.id);
      return true;
    } else if (key === "root") {
      if (value) {
        target._raw.set("root", value.id as unknown as CoID<RawCoMap>);
      }
      subscriptionsScopes
        .get(receiver)
        ?.onRefAccessedOrSet(target.id, value.id);
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  },
  defineProperty(target, key, descriptor) {
    if (
      (key === "profile" || key === "root" || key === MembersSym) &&
      typeof descriptor.value === "object" &&
      SchemaInit in descriptor.value
    ) {
      (target.constructor as typeof CoMap)._schema ||= {};
      (target.constructor as typeof CoMap)._schema[key] =
        descriptor.value[SchemaInit];
      return true;
    } else {
      return Reflect.defineProperty(target, key, descriptor);
    }
  },
};

/** @category Identity & Permissions */
export function isControlledAccount(account: Account): account is Account & {
  isMe: true;
  sessionID: SessionID;
  _raw: RawControlledAccount;
} {
  return account.isMe;
}

export type AccountClass<Acc extends Account> = CoValueClass<Acc> & {
  fromNode: (typeof Account)["fromNode"];
};
