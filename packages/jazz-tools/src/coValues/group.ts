import type { Everyone, RawAccountID, RawGroup, Role } from "cojson";
import type {
  CoValue,
  CoValueClass,
  ID,
  RefEncoded,
  RefsToResolve,
  Resolved,
  Schema,
} from "../internal.js";
import {
  Account,
  AccountAndGroupProxyHandler,
  CoMap,
  CoValueBase,
  MembersSym,
  Ref,
  co,
  ensureCoValueLoaded,
  isControlledAccount,
  loadCoValue,
  subscribeToCoValue,
  subscribeToExistingCoValue,
} from "../internal.js";

/** @category Identity & Permissions */
export class Profile extends CoMap {
  name = co.string;
}

/** @category Identity & Permissions */
export class Group extends CoValueBase implements CoValue {
  declare id: ID<this>;
  declare _type: "Group";
  static {
    this.prototype._type = "Group";
  }
  declare _raw: RawGroup;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _schema: any;
  get _schema(): {
    profile: Schema;
    root: Schema;
    [MembersSym]: RefEncoded<Account>;
  } {
    return (this.constructor as typeof Group)._schema;
  }
  static {
    this._schema = {
      profile: "json" satisfies Schema,
      root: "json" satisfies Schema,
      [MembersSym]: {
        ref: () => Account,
        optional: false,
      } satisfies RefEncoded<Account>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    Object.defineProperty(this.prototype, "_schema", {
      get: () => this._schema,
    });
  }

  declare profile: Profile | null;
  declare root: CoMap | null;
  declare [MembersSym]: Account | null;

  get _refs(): {
    profile: Ref<Profile> | undefined;
    root: Ref<CoMap> | undefined;
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
          this._schema.profile as RefEncoded<NonNullable<this["profile"]>>,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any as this["profile"] extends Profile
          ? Ref<this["profile"]>
          : never),
      root:
        rootID &&
        (new Ref(
          rootID,
          this._loadedAs,
          this._schema.root as RefEncoded<NonNullable<this["root"]>>,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any as this["root"] extends CoMap ? Ref<this["root"]> : never),
    };
  }

  /** @deprecated Don't use constructor directly, use .create */
  constructor(options: { fromRaw: RawGroup } | { owner: Account | Group }) {
    super();
    let raw: RawGroup;

    if (options && "fromRaw" in options) {
      raw = options.fromRaw;
    } else {
      const initOwner = options.owner;
      if (!initOwner) throw new Error("No owner provided");
      if (initOwner._type === "Account" && isControlledAccount(initOwner)) {
        const rawOwner = initOwner._raw;
        raw = rawOwner.createGroup();
      } else {
        throw new Error("Can only construct group as a controlled account");
      }
    }

    Object.defineProperties(this, {
      id: {
        value: raw.id,
        enumerable: false,
      },
      _raw: { value: raw, enumerable: false },
    });

    return new Proxy(this, AccountAndGroupProxyHandler as ProxyHandler<this>);
  }

  static create<G extends Group>(
    this: CoValueClass<G>,
    options: { owner: Account },
  ) {
    return new this(options);
  }

  myRole(): Role | undefined {
    return this._raw.myRole();
  }

  addMember(member: Everyone | Account, role: Role) {
    this._raw.addMember(member === "everyone" ? member : member._raw, role);
    return this;
  }

  removeMember(member: Everyone | Account) {
    this._raw.removeMember(member === "everyone" ? member : member._raw);
    return this;
  }

  get members() {
    return this._raw
      .keys()
      .filter((key) => {
        return key === "everyone" || key.startsWith("co_");
      })
      .map((id) => {
        const role = this._raw.get(id as Everyone | RawAccountID);
        const accountID =
          id === "everyone" ? undefined : (id as unknown as ID<Account>);
        const ref =
          accountID &&
          new Ref<NonNullable<this[MembersSym]>>(
            accountID,
            this._loadedAs,
            this._schema[MembersSym],
          );
        const accessRef = () => ref?.accessFrom(this, "members." + id);

        return {
          id: id as unknown as Everyone | ID<this[MembersSym]>,
          role,
          ref,
          get account() {
            return accessRef();
          },
        };
      });
  }

  extend(parent: Group) {
    this._raw.extend(parent._raw);
    return this;
  }

  /** @category Subscription & Loading */
  static load<G extends Group, const O extends { resolve?: RefsToResolve<G> }>(
    this: CoValueClass<G>,
    id: ID<G>,
    as: Account,
    options?: O,
  ): Promise<Resolved<G, O> | undefined> {
    return loadCoValue(this, id, as, options);
  }

  /** @category Subscription & Loading */
  static subscribe<
    G extends Group,
    const O extends { resolve?: RefsToResolve<G> },
  >(
    this: CoValueClass<G>,
    id: ID<G>,
    as: Account,
    options: O,
    listener: (value: Resolved<G, O>) => void,
  ): () => void {
    return subscribeToCoValue<G, O>(this, id, as, options, listener);
  }

  /** @category Subscription & Loading */
  ensureLoaded<G extends Group, const O extends { resolve?: RefsToResolve<G> }>(
    this: G,
    options?: O,
  ): Promise<Resolved<G, O> | undefined> {
    return ensureCoValueLoaded(this, options);
  }

  /** @category Subscription & Loading */
  subscribe<G extends Group, const O extends { resolve?: RefsToResolve<G> }>(
    this: G,
    options: O,
    listener: (value: Resolved<G, O>) => void,
  ): () => void {
    return subscribeToExistingCoValue(this, options, listener);
  }

  /**
   * Wait for the `Group` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: { timeout?: number }) {
    return this._raw.core.waitForSync(options);
  }
}
