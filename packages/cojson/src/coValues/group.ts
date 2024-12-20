import { base58 } from "@scure/base";
import { CoID } from "../coValue.js";
import { CoValueUniqueness } from "../coValueCore.js";
import { Encrypted, KeyID, KeySecret, Sealed } from "../crypto/crypto.js";
import {
  AgentID,
  ChildGroupReference,
  ParentGroupReference,
  getChildGroupId,
  getParentGroupId,
  isAgentID,
  isChildGroupReference,
  isParentGroupReference,
} from "../ids.js";
import { JsonObject } from "../jsonValue.js";
import { AccountRole, Role } from "../permissions.js";
import { expectGroup } from "../typeUtils/expectGroup.js";
import {
  ControlledAccountOrAgent,
  RawAccount,
  RawAccountID,
} from "./account.js";
import { RawCoList } from "./coList.js";
import { RawCoMap } from "./coMap.js";
import { RawBinaryCoStream, RawCoStream } from "./coStream.js";

export const EVERYONE = "everyone" as const;
export type Everyone = "everyone";

export type GroupShape = {
  profile: CoID<RawCoMap> | null;
  root: CoID<RawCoMap> | null;
  [key: RawAccountID | AgentID]: Role;
  [EVERYONE]?: Role;
  readKey?: KeyID;
  [writeKeyFor: `writeKeyFor_${RawAccountID | AgentID}`]: KeyID;
  [revelationFor: `${KeyID}_for_${RawAccountID | AgentID}`]: Sealed<KeySecret>;
  [revelationFor: `${KeyID}_for_${Everyone}`]: KeySecret;
  [oldKeyForNewKey: `${KeyID}_for_${KeyID}`]: Encrypted<
    KeySecret,
    { encryptedID: KeyID; encryptingID: KeyID }
  >;
  [parent: ParentGroupReference]: "extend";
  [child: ChildGroupReference]: "extend";
};

/** A `Group` is a scope for permissions of its members (`"reader" | "writer" | "admin"`), applying to objects owned by that group.
 *
 *  A `Group` object exposes methods for permission management and allows you to create new CoValues owned by that group.
 *
 *  (Internally, a `Group` is also just a `CoMap`, mapping member accounts to roles and containing some
 *  state management for making cryptographic keys available to current members)
 *
 *  @example
 *  You typically get a group from a CoValue that you already have loaded:
 *
 *  ```typescript
 *  const group = coMap.group;
 *  ```
 *
 *  @example
 *  Or, you can create a new group with a `LocalNode`:
 *
 *  ```typescript
 *  const localNode.createGroup();
 *  ```
 * */
export class RawGroup<
  Meta extends JsonObject | null = JsonObject | null,
> extends RawCoMap<GroupShape, Meta> {
  /**
   * Returns the current role of a given account.
   *
   * @category 1. Role reading
   */
  roleOf(accountID: RawAccountID): Role | undefined {
    return this.roleOfInternal(accountID)?.role;
  }

  /** @internal */
  roleOfInternal(
    accountID: RawAccountID | AgentID | typeof EVERYONE,
  ): { role: Role; via: CoID<RawGroup> | undefined } | undefined {
    const roleHere = this.get(accountID);

    if (roleHere === "revoked") {
      return undefined;
    }

    let roleInfo:
      | {
          role: Exclude<Role, "revoked">;
          via: CoID<RawGroup> | undefined;
        }
      | undefined = roleHere && { role: roleHere, via: undefined };

    const parentGroups = this.getParentGroups(this.atTimeFilter);

    for (const parentGroup of parentGroups) {
      const roleInParent = parentGroup.roleOfInternal(accountID);

      if (
        roleInParent &&
        roleInParent.role !== "revoked" &&
        isMorePermissiveAndShouldInherit(roleInParent.role, roleInfo?.role)
      ) {
        roleInfo = { role: roleInParent.role, via: parentGroup.id };
      }
    }

    return roleInfo;
  }

  getParentGroups(atTime?: number) {
    const groups: RawGroup[] = [];

    for (const key of this.keys()) {
      if (isParentGroupReference(key)) {
        const parent = this.core.node.expectCoValueLoaded(
          getParentGroupId(key),
          "Expected parent group to be loaded",
        );

        const parentGroup = expectGroup(parent.getCurrentContent());

        if (atTime) {
          groups.push(parentGroup.atTime(atTime));
        } else {
          groups.push(parentGroup);
        }
      }
    }

    return groups;
  }

  loadAllChildGroups() {
    const requests: Promise<unknown>[] = [];
    const store = this.core.node.coValuesStore;
    const peers = this.core.node.syncManager.getServerAndStoragePeers();

    for (const key of this.keys()) {
      if (!isChildGroupReference(key)) {
        continue;
      }

      const id = getChildGroupId(key);
      const child = store.get(id);

      if (
        child.state.type === "unknown" ||
        child.state.type === "unavailable"
      ) {
        child.loadFromPeers(peers).catch(() => {
          console.error(`Failed to load child group ${id}`);
        });
      }

      requests.push(
        child.getCoValue().then((coValue) => {
          if (coValue === "unavailable") {
            throw new Error(`Child group ${child.id} is unavailable`);
          }

          // Recursively load child groups
          return expectGroup(coValue.getCurrentContent()).loadAllChildGroups();
        }),
      );
    }

    return Promise.all(requests);
  }

  getChildGroups() {
    const groups: RawGroup[] = [];

    for (const key of this.keys()) {
      if (isChildGroupReference(key)) {
        const child = this.core.node.expectCoValueLoaded(
          getChildGroupId(key),
          "Expected child group to be loaded",
        );
        groups.push(expectGroup(child.getCurrentContent()));
      }
    }

    return groups;
  }

  /**
   * Returns the role of the current account in the group.
   *
   * @category 1. Role reading
   */
  myRole(): Role | undefined {
    return this.roleOfInternal(this.core.node.account.id)?.role;
  }

  /**
   * Directly grants a new member a role in the group. The current account must be an
   * admin to be able to do so. Throws otherwise.
   *
   * @category 2. Role changing
   */
  addMember(
    account: RawAccount | ControlledAccountOrAgent | Everyone,
    role: Role,
  ) {
    this.addMemberInternal(account, role);
  }

  /** @internal */
  addMemberInternal(
    account: RawAccount | ControlledAccountOrAgent | AgentID | Everyone,
    role: Role,
  ) {
    if (account === EVERYONE) {
      if (!(role === "reader" || role === "writer")) {
        throw new Error(
          "Can't make everyone something other than reader or writer",
        );
      }

      const currentReadKey = this.core.getCurrentReadKey();

      if (!currentReadKey.secret) {
        throw new Error("Can't add member without read key secret");
      }

      this.set(account, role, "trusting");

      if (this.get(account) !== role) {
        throw new Error("Failed to set role");
      }

      this.set(
        `${currentReadKey.id}_for_${EVERYONE}`,
        currentReadKey.secret,
        "trusting",
      );

      return;
    }

    const memberKey = typeof account === "string" ? account : account.id;
    const agent =
      typeof account === "string"
        ? account
        : account.currentAgentID()._unsafeUnwrap({ withStackTrace: true });

    /**
     * WriteOnly members can only see their own changes.
     *
     * We don't want to reveal the readKey to them so we create a new one specifically for them and also reveal it to everyone else with a reader or higher-capability role (but crucially not to other writer-only members)
     * to everyone else.
     *
     * To never reveal the readKey to writeOnly members we also create a dedicated writeKey for the
     * invite.
     */
    if (role === "writeOnly" || role === "writeOnlyInvite") {
      const writeKeyForNewMember = this.core.crypto.newRandomKeySecret();

      this.set(memberKey, role, "trusting");
      this.set(`writeKeyFor_${memberKey}`, writeKeyForNewMember.id, "trusting");

      this.storeKeyRevelationForMember(
        memberKey,
        agent,
        writeKeyForNewMember.id,
        writeKeyForNewMember.secret,
      );

      for (const otherMemberKey of this.getMemberKeys()) {
        const memberRole = this.get(otherMemberKey);

        if (
          memberRole === "reader" ||
          memberRole === "writer" ||
          memberRole === "admin" ||
          memberRole === "readerInvite" ||
          memberRole === "writerInvite" ||
          memberRole === "adminInvite"
        ) {
          const otherMemberAgent = this.core.node
            .resolveAccountAgent(
              otherMemberKey,
              "Expected member agent to be loaded",
            )
            ._unsafeUnwrap({ withStackTrace: true });

          this.storeKeyRevelationForMember(
            otherMemberKey,
            otherMemberAgent,
            writeKeyForNewMember.id,
            writeKeyForNewMember.secret,
          );
        }
      }
    } else {
      const currentReadKey = this.core.getCurrentReadKey();

      if (!currentReadKey.secret) {
        throw new Error("Can't add member without read key secret");
      }

      this.set(memberKey, role, "trusting");

      if (this.get(memberKey) !== role) {
        throw new Error("Failed to set role");
      }

      this.storeKeyRevelationForMember(
        memberKey,
        agent,
        currentReadKey.id,
        currentReadKey.secret,
      );

      for (const keyID of this.getWriteOnlyKeys()) {
        const secret = this.core.getReadKey(keyID);

        if (!secret) {
          console.error("Can't find key", keyID);
          continue;
        }

        this.storeKeyRevelationForMember(memberKey, agent, keyID, secret);
      }
    }
  }

  private storeKeyRevelationForMember(
    memberKey: RawAccountID | AgentID,
    agent: AgentID,
    keyID: KeyID,
    secret: KeySecret,
  ) {
    this.set(
      `${keyID}_for_${memberKey}`,
      this.core.crypto.seal({
        message: secret,
        from: this.core.node.account.currentSealerSecret(),
        to: this.core.crypto.getAgentSealerID(agent),
        nOnceMaterial: {
          in: this.id,
          tx: this.core.nextTransactionID(),
        },
      }),
      "trusting",
    );
  }

  private getWriteOnlyKeys() {
    const keys: KeyID[] = [];

    for (const key of this.keys()) {
      if (key.startsWith("writeKeyFor_")) {
        keys.push(
          this.get(key as `writeKeyFor_${RawAccountID | AgentID}`) as KeyID,
        );
      }
    }

    return keys;
  }

  getCurrentReadKeyId() {
    if (this.myRole() === "writeOnly") {
      const accountId = this.core.node.account.id;

      return this.get(`writeKeyFor_${accountId}`) as KeyID;
    }

    return this.get("readKey");
  }

  getMemberKeys(): (RawAccountID | AgentID)[] {
    return this.keys().filter((key): key is RawAccountID | AgentID => {
      return key.startsWith("co_") || isAgentID(key);
    });
  }

  /** @internal */
  rotateReadKey() {
    const memberKeys = this.getMemberKeys();

    const currentlyPermittedReaders = memberKeys.filter((key) => {
      const role = this.get(key);
      return (
        role === "admin" ||
        role === "writer" ||
        role === "reader" ||
        role === "adminInvite" ||
        role === "writerInvite" ||
        role === "readerInvite"
      );
    });

    const writeOnlyMembers = memberKeys.filter((key) => {
      const role = this.get(key);
      return role === "writeOnly" || role === "writeOnlyInvite";
    });

    // Get these early, so we fail fast if they are unavailable
    const parentGroups = this.getParentGroups();
    const childGroups = this.getChildGroups();

    const maybeCurrentReadKey = this.core.getCurrentReadKey();

    if (!maybeCurrentReadKey.secret) {
      throw new Error("Can't rotate read key secret we don't have access to");
    }

    const currentReadKey = {
      id: maybeCurrentReadKey.id,
      secret: maybeCurrentReadKey.secret,
    };

    const newReadKey = this.core.crypto.newRandomKeySecret();

    for (const readerID of currentlyPermittedReaders) {
      const agent = this.core.node
        .resolveAccountAgent(
          readerID,
          "Expected to know currently permitted reader",
        )
        ._unsafeUnwrap({ withStackTrace: true });

      this.storeKeyRevelationForMember(
        readerID,
        agent,
        newReadKey.id,
        newReadKey.secret,
      );
    }

    /**
     * If there are some writeOnly members we need to rotate their keys
     * and reveal them to the other non-writeOnly members
     */
    for (const writeOnlyMemberID of writeOnlyMembers) {
      const agent = this.core.node
        .resolveAccountAgent(
          writeOnlyMemberID,
          "Expected to know writeOnly member",
        )
        ._unsafeUnwrap({ withStackTrace: true });

      const writeOnlyKey = this.core.crypto.newRandomKeySecret();

      this.storeKeyRevelationForMember(
        writeOnlyMemberID,
        agent,
        writeOnlyKey.id,
        writeOnlyKey.secret,
      );
      this.set(`writeKeyFor_${writeOnlyMemberID}`, writeOnlyKey.id, "trusting");

      for (const readerID of currentlyPermittedReaders) {
        const agent = this.core.node
          .resolveAccountAgent(
            readerID,
            "Expected to know currently permitted reader",
          )
          ._unsafeUnwrap({ withStackTrace: true });

        this.storeKeyRevelationForMember(
          readerID,
          agent,
          writeOnlyKey.id,
          writeOnlyKey.secret,
        );
      }
    }

    this.set(
      `${currentReadKey.id}_for_${newReadKey.id}`,
      this.core.crypto.encryptKeySecret({
        encrypting: newReadKey,
        toEncrypt: currentReadKey,
      }).encrypted,
      "trusting",
    );

    this.set("readKey", newReadKey.id, "trusting");

    /**
     * The new read key needs to be revealed to the parent groups
     *
     * This way the members from the parent groups can still have access to this group
     */
    for (const parent of parentGroups) {
      const { id: parentReadKeyID, secret: parentReadKeySecret } =
        parent.core.getCurrentReadKey();

      if (!parentReadKeySecret) {
        throw new Error(
          "Can't reveal new child key to parent where we don't have access to the parent read key",
        );
      }

      this.set(
        `${newReadKey.id}_for_${parentReadKeyID}`,
        this.core.crypto.encryptKeySecret({
          encrypting: {
            id: parentReadKeyID,
            secret: parentReadKeySecret,
          },
          toEncrypt: newReadKey,
        }).encrypted,
        "trusting",
      );
    }

    for (const child of childGroups) {
      child.rotateReadKey();
    }
  }

  extend(parent: RawGroup) {
    if (parent.myRole() !== "admin" || this.myRole() !== "admin") {
      throw new Error(
        "To extend a group, the current account must have admin role in both groups",
      );
    }

    this.set(`parent_${parent.id}`, "extend", "trusting");
    parent.set(`child_${this.id}`, "extend", "trusting");

    const { id: parentReadKeyID, secret: parentReadKeySecret } =
      parent.core.getCurrentReadKey();
    if (!parentReadKeySecret) {
      throw new Error("Can't extend group without parent read key secret");
    }

    const { id: childReadKeyID, secret: childReadKeySecret } =
      this.core.getCurrentReadKey();
    if (!childReadKeySecret) {
      throw new Error("Can't extend group without child read key secret");
    }

    this.set(
      `${childReadKeyID}_for_${parentReadKeyID}`,
      this.core.crypto.encryptKeySecret({
        encrypting: {
          id: parentReadKeyID,
          secret: parentReadKeySecret,
        },
        toEncrypt: {
          id: childReadKeyID,
          secret: childReadKeySecret,
        },
      }).encrypted,
      "trusting",
    );
  }

  /**
   * Strips the specified member of all roles (preventing future writes in
   *  the group and owned values) and rotates the read encryption key for that group
   * (preventing reads of new content in the group and owned values)
   *
   * @category 2. Role changing
   */
  async removeMember(
    account: RawAccount | ControlledAccountOrAgent | Everyone,
  ) {
    // Ensure all child groups are loaded before removing a member
    await this.loadAllChildGroups();

    this.removeMemberInternal(account);
  }

  /** @internal */
  removeMemberInternal(
    account: RawAccount | ControlledAccountOrAgent | AgentID | Everyone,
  ) {
    const memberKey = typeof account === "string" ? account : account.id;
    this.set(memberKey, "revoked", "trusting");
    this.rotateReadKey();
  }

  /**
   * Creates an invite for new members to indirectly join the group,
   * allowing them to grant themselves the specified role with the InviteSecret
   * (a string starting with "inviteSecret_") - use `LocalNode.acceptInvite()` for this purpose.
   *
   * @category 2. Role changing
   */
  createInvite(role: AccountRole): InviteSecret {
    const secretSeed = this.core.crypto.newRandomSecretSeed();

    const inviteSecret = this.core.crypto.agentSecretFromSecretSeed(secretSeed);
    const inviteID = this.core.crypto.getAgentID(inviteSecret);

    this.addMemberInternal(inviteID, `${role}Invite` as Role);

    return inviteSecretFromSecretSeed(secretSeed);
  }

  /**
   * Creates a new `CoMap` within this group, with the specified specialized
   * `CoMap` type `M` and optional static metadata.
   *
   * @category 3. Value creation
   */
  createMap<M extends RawCoMap>(
    init?: M["_shape"],
    meta?: M["headerMeta"],
    initPrivacy: "trusting" | "private" = "private",
    uniqueness: CoValueUniqueness = this.core.crypto.createdNowUnique(),
  ): M {
    const map = this.core.node
      .createCoValue({
        type: "comap",
        ruleset: {
          type: "ownedByGroup",
          group: this.id,
        },
        meta: meta || null,
        ...uniqueness,
      })
      .getCurrentContent() as M;

    if (init) {
      map.assign(init, initPrivacy);
    }

    return map;
  }

  /**
   * Creates a new `CoList` within this group, with the specified specialized
   * `CoList` type `L` and optional static metadata.
   *
   * @category 3. Value creation
   */
  createList<L extends RawCoList>(
    init?: L["_item"][],
    meta?: L["headerMeta"],
    initPrivacy: "trusting" | "private" = "private",
    uniqueness: CoValueUniqueness = this.core.crypto.createdNowUnique(),
  ): L {
    const list = this.core.node
      .createCoValue({
        type: "colist",
        ruleset: {
          type: "ownedByGroup",
          group: this.id,
        },
        meta: meta || null,
        ...uniqueness,
      })
      .getCurrentContent() as L;

    if (init?.length) {
      list.appendItems(init, undefined, initPrivacy);
    }

    return list;
  }

  /** @category 3. Value creation */
  createStream<C extends RawCoStream>(
    meta?: C["headerMeta"],
    uniqueness: CoValueUniqueness = this.core.crypto.createdNowUnique(),
  ): C {
    return this.core.node
      .createCoValue({
        type: "costream",
        ruleset: {
          type: "ownedByGroup",
          group: this.id,
        },
        meta: meta || null,
        ...uniqueness,
      })
      .getCurrentContent() as C;
  }

  /** @category 3. Value creation */
  createBinaryStream<C extends RawBinaryCoStream>(
    meta: C["headerMeta"] = { type: "binary" },
    uniqueness: CoValueUniqueness = this.core.crypto.createdNowUnique(),
  ): C {
    return this.core.node
      .createCoValue({
        type: "costream",
        ruleset: {
          type: "ownedByGroup",
          group: this.id,
        },
        meta: meta,
        ...uniqueness,
      })
      .getCurrentContent() as C;
  }
}

function isMorePermissiveAndShouldInherit(
  roleInParent: Role,
  roleInChild: Exclude<Role, "revoked"> | undefined,
) {
  // invites should never be inherited
  if (
    roleInParent === "adminInvite" ||
    roleInParent === "writerInvite" ||
    roleInParent === "readerInvite"
  ) {
    return false;
  }

  if (roleInParent === "admin") {
    return !roleInChild || roleInChild !== "admin";
  }

  if (roleInParent === "writer") {
    return (
      !roleInChild || roleInChild === "reader" || roleInChild === "writeOnly"
    );
  }

  if (roleInParent === "reader") {
    return !roleInChild;
  }

  // writeOnly can't be inherited
  if (roleInParent === "writeOnly") {
    return false;
  }

  return false;
}

export type InviteSecret = `inviteSecret_z${string}`;

function inviteSecretFromSecretSeed(secretSeed: Uint8Array): InviteSecret {
  return `inviteSecret_z${base58.encode(secretSeed)}`;
}

export function secretSeedFromInviteSecret(inviteSecret: InviteSecret) {
  if (!inviteSecret.startsWith("inviteSecret_z")) {
    throw new Error("Invalid invite secret");
  }

  return base58.decode(inviteSecret.slice("inviteSecret_z".length));
}
