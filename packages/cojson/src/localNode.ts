import { Result, err, ok } from "neverthrow";
import { CoValuesStore } from "./CoValuesStore.js";
import { PeerEntry } from "./PeerEntry.js";
import { CoID, RawCoValue } from "./coValue.js";
import {
  CoValueCore,
  CoValueHeader,
  CoValueUniqueness,
} from "./coValueCore.js";
import {
  AccountMeta,
  ControlledAccountOrAgent,
  ControlledAgent,
  InvalidAccountAgentIDError,
  RawProfile as Profile,
  RawAccount,
  RawAccountID,
  RawAccountMigration,
  RawControlledAccount,
  RawProfile,
  accountHeaderForInitialAgentSecret,
} from "./coValues/account.js";
import {
  InviteSecret,
  RawGroup,
  secretSeedFromInviteSecret,
} from "./coValues/group.js";
import { AgentSecret, CryptoProvider } from "./crypto/crypto.js";
import { AgentID, RawCoID, SessionID, isAgentID } from "./ids.js";
import {
  DisconnectedError,
  PingTimeoutError,
  SyncManager,
  SyncMessage,
  emptyKnownState,
} from "./sync.js";
import { transformIncomingMessageFromPeer } from "./transformers.js";
import { expectGroup } from "./typeUtils/expectGroup.js";

export type PeerID = string;
export type IncomingSyncStream = AsyncIterable<
  SyncMessage | DisconnectedError | PingTimeoutError
>;
export type OutgoingSyncQueue = {
  push: (msg: SyncMessage) => Promise<unknown>;
  close: () => void;
};

export interface Peer {
  id: PeerID;
  incoming: IncomingSyncStream;
  outgoing: OutgoingSyncQueue;
  role: "peer" | "server" | "client" | "storage";
  priority?: number;
  crashOnClose: boolean;
  deletePeerStateOnClose?: boolean;
}

/** A `LocalNode` represents a local view of a set of loaded `CoValue`s, from the perspective of a particular account (or primitive cryptographic agent).

A `LocalNode` can have peers that it syncs to, for example some form of local persistence, or a sync server, such as `cloud.jazz.tools` (Jazz Cloud).

@example
You typically get hold of a `LocalNode` using `jazz-react`'s `useJazz()`:

```typescript
const { localNode } = useJazz();
```
*/
export class LocalNode {
  /** @internal */
  crypto: CryptoProvider;
  /** @internal */
  coValuesStore = new CoValuesStore();
  /** @category 3. Low-level */
  account: ControlledAccountOrAgent;
  /** @category 3. Low-level */
  currentSessionID: SessionID;
  /** @category 3. Low-level */
  syncManager = new SyncManager(this);
  peers: { [key: PeerID]: PeerEntry } = {};
  crashed: Error | undefined = undefined;

  /** @category 3. Low-level */
  constructor(
    account: ControlledAccountOrAgent,
    currentSessionID: SessionID,
    crypto: CryptoProvider,
  ) {
    this.account = account;
    this.currentSessionID = currentSessionID;
    this.crypto = crypto;
  }

  peersInPriorityOrder(): PeerEntry[] {
    return Object.values(this.peers).sort((a, b) => {
      const aPriority = a.priority || 0;
      const bPriority = b.priority || 0;

      return bPriority - aPriority;
    });
  }

  getServerAndStoragePeers(excludePeerId?: PeerID): PeerEntry[] {
    return this.peersInPriorityOrder().filter(
      (peer) => peer.isServerOrStoragePeer() && peer.id !== excludePeerId,
    );
  }

  async processMessages(peer: PeerEntry) {
    for await (const msg of peer.incoming) {
      if (msg === "Disconnected") {
        return;
      }
      if (msg === "PingTimeout") {
        console.error("Ping timeout from peer", peer.id);
        return;
      }
      try {
        console.log("🔵 ===>>> Received from", peer.id, msg);
        await this.syncManager.handleSyncMessage(
          transformIncomingMessageFromPeer(msg, peer.id),
          peer,
        );
      } catch (e) {
        throw new Error(
          `Error reading from peer ${peer.id}, handling msg\n\n${JSON.stringify(
            msg,
            (k, v) =>
              k === "changes" || k === "encryptedChanges"
                ? v.slice(0, 20) + "..."
                : v,
          )}`,
          { cause: e },
        );
      }
    }
  }

  addPeer(peerData: Peer) {
    const prevPeer = this.peers[peerData.id];
    const peer = new PeerEntry(peerData);
    this.peers[peerData.id] = peer;

    if (prevPeer && !prevPeer.closed) {
      prevPeer.gracefulShutdown();
    }

    if (peer.isServerOrStoragePeer()) {
      void this.syncManager.initialSync(peerData, peer);
    }

    this.processMessages(peer)
      .then(() => {
        if (peerData.crashOnClose) {
          console.error("Unexepcted close from peer", peerData.id);
          this.crashed = new Error("Unexpected close from peer");
          throw new Error("Unexpected close from peer");
        }
      })
      .catch((e) => {
        console.error("Error processing messages from peer", peerData.id, e);
        if (peerData.crashOnClose) {
          this.crashed = e;
          throw new Error(e);
        }
      })
      .finally(() => {
        const state = this.peers[peerData.id];
        state?.gracefulShutdown();

        if (peerData.deletePeerStateOnClose) {
          delete this.peers[peerData.id];
        }
      });
  }

  /** @category 2. Node Creation */
  static async withNewlyCreatedAccount<Meta extends AccountMeta = AccountMeta>({
    creationProps,
    peersToLoadFrom,
    migration,
    crypto,
    initialAgentSecret = crypto.newRandomAgentSecret(),
  }: {
    creationProps: { name: string };
    peersToLoadFrom?: Peer[];
    migration?: RawAccountMigration<Meta>;
    crypto: CryptoProvider;
    initialAgentSecret?: AgentSecret;
  }): Promise<{
    node: LocalNode;
    accountID: RawAccountID;
    accountSecret: AgentSecret;
    sessionID: SessionID;
  }> {
    const throwawayAgent = crypto.newRandomAgentSecret();
    const setupNode = new LocalNode(
      new ControlledAgent(throwawayAgent, crypto),
      crypto.newRandomSessionID(crypto.getAgentID(throwawayAgent)),
      crypto,
    );

    const account = setupNode.createAccount(initialAgentSecret);

    const nodeWithAccount = account.core.node.testWithDifferentAccount(
      account,
      crypto.newRandomSessionID(account.id),
    );

    const accountOnNodeWithAccount =
      nodeWithAccount.account as RawControlledAccount<Meta>;

    if (peersToLoadFrom) {
      for (const peer of peersToLoadFrom) {
        nodeWithAccount.addPeer(peer);
      }
    }

    if (migration) {
      await migration(accountOnNodeWithAccount, nodeWithAccount, creationProps);
    } else {
      const profileGroup = accountOnNodeWithAccount.createGroup();
      profileGroup.addMember("everyone", "reader");
      const profile = profileGroup.createMap<Profile>({
        name: creationProps.name,
      });
      accountOnNodeWithAccount.set("profile", profile.id, "trusting");
    }

    const controlledAccount = new RawControlledAccount(
      accountOnNodeWithAccount.core,
      accountOnNodeWithAccount.agentSecret,
    );

    nodeWithAccount.account = controlledAccount;
    nodeWithAccount.coValuesStore.setAsAvailable(
      controlledAccount.id,
      controlledAccount.core,
    );
    controlledAccount.core._cachedContent = undefined;

    if (!controlledAccount.get("profile")) {
      throw new Error("Must set account profile in initial migration");
    }

    // we shouldn't need this, but it fixes account data not syncing for new accounts
    function syncAllCoValuesAfterCreateAccount() {
      for (const coValueEntry of nodeWithAccount.coValuesStore.getValues()) {
        if (coValueEntry.state.type === "available") {
          void nodeWithAccount.syncManager.syncCoValue(
            coValueEntry.state.coValue,
            emptyKnownState(coValueEntry.id),
          );
        }
      }
    }

    syncAllCoValuesAfterCreateAccount();

    setTimeout(syncAllCoValuesAfterCreateAccount, 500);

    return {
      node: nodeWithAccount,
      accountID: accountOnNodeWithAccount.id,
      accountSecret: accountOnNodeWithAccount.agentSecret,
      sessionID: nodeWithAccount.currentSessionID,
    };
  }

  /** @category 2. Node Creation */
  static async withLoadedAccount<Meta extends AccountMeta = AccountMeta>({
    accountID,
    accountSecret,
    sessionID,
    peersToLoadFrom,
    crypto,
    migration,
  }: {
    accountID: RawAccountID;
    accountSecret: AgentSecret;
    sessionID: SessionID | undefined;
    peersToLoadFrom: Peer[];
    crypto: CryptoProvider;
    migration?: RawAccountMigration<Meta>;
  }): Promise<LocalNode> {
    try {
      const loadingNode = new LocalNode(
        new ControlledAgent(accountSecret, crypto),
        crypto.newRandomSessionID(accountID),
        crypto,
      );

      for (const peer of peersToLoadFrom) {
        loadingNode.addPeer(peer);
      }

      const accountPromise = loadingNode.load<RawAccount>(accountID);

      const account = await accountPromise;

      if (account === "unavailable") {
        throw new Error("Account unavailable from all peers");
      }

      const controlledAccount = new RawControlledAccount(
        account.core,
        accountSecret,
      );

      // since this is all synchronous, we can just swap out nodes for the SyncManager
      const node = loadingNode.testWithDifferentAccount(
        controlledAccount,
        sessionID || crypto.newRandomSessionID(accountID),
      );
      node.syncManager = loadingNode.syncManager;
      node.syncManager.local = node;

      controlledAccount.core.node = node;
      node.coValuesStore.setAsAvailable(accountID, controlledAccount.core);
      controlledAccount.core._cachedContent = undefined;

      const profileID = account.get("profile");
      if (!profileID) {
        throw new Error("Account has no profile");
      }
      const profile = await node.load(profileID);

      if (profile === "unavailable") {
        throw new Error("Profile unavailable from all peers");
      }

      if (migration) {
        await migration(controlledAccount as RawControlledAccount<Meta>, node);
        node.account = new RawControlledAccount(
          controlledAccount.core,
          controlledAccount.agentSecret,
        );
      }

      return node;
    } catch (e) {
      console.error("Error withLoadedAccount", e);
      throw e;
    }
  }

  /** @internal */
  createCoValue(header: CoValueHeader): CoValueCore {
    if (this.crashed) {
      throw new Error("Trying to create CoValue after node has crashed", {
        cause: this.crashed,
      });
    }

    const coValue = new CoValueCore(header, this);
    this.coValuesStore.setAsAvailable(coValue.id, coValue);

    void this.syncManager.syncCoValue(coValue, emptyKnownState(coValue.id));

    return coValue;
  }

  /**
   * Loads a CoValue's content, syncing from peers as necessary and resolving the returned
   * promise once a first version has been loaded. See `coValue.subscribe()` and `node.useTelepathicData()`
   * for listening to subsequent updates to the CoValue.
   *
   * @category 3. Low-level
   */
  async load<T extends RawCoValue>(
    id: RawCoID,
    returnCore?: false,
  ): Promise<"unavailable" | T>;
  async load<T extends RawCoValue>(
    id: RawCoID,
    returnCore: true,
  ): Promise<"unavailable" | CoValueCore>;
  async load<T extends RawCoValue>(
    id: RawCoID,
    returnCore: boolean = false,
  ): Promise<"unavailable" | CoValueCore | T> {
    if (this.crashed) {
      throw new Error("Trying to load CoValue after node has crashed", {
        cause: this.crashed,
      });
    }

    const core = await this.syncManager.loadCoValueCore(id);

    if (core === "unavailable") {
      return "unavailable";
    }

    if (returnCore) {
      return core;
    }

    return core.getCurrentContent() as T;
  }

  getLoaded<T extends RawCoValue>(id: CoID<T>): T | undefined {
    const entry = this.coValuesStore.get(id);

    if (entry.state.type === "available") {
      return entry.state.coValue.getCurrentContent() as T;
    }

    return undefined;
  }

  /** @category 3. Low-level */
  subscribe<T extends RawCoValue>(
    id: CoID<T>,
    callback: (update: T | "unavailable") => void,
  ): () => void {
    let stopped = false;
    let unsubscribe!: () => void;

    // console.log("Subscribing to " + id);

    this.load<T>(id)
      .then((coValue) => {
        if (stopped) {
          return;
        }
        if (coValue === "unavailable") {
          callback("unavailable");
          return;
        }
        unsubscribe = coValue.subscribe(callback);
      })
      .catch((e) => {
        console.error("Error subscribing to ", id, e);
      });

    return () => {
      console.log("Unsubscribing from " + id);
      stopped = true;
      unsubscribe?.();
    };
  }

  /** @deprecated Use Account.acceptInvite instead */
  async acceptInvite<T extends RawCoValue>(
    groupOrOwnedValueID: CoID<T>,
    inviteSecret: InviteSecret,
  ): Promise<void> {
    const groupOrOwnedValue = await this.load(groupOrOwnedValueID);

    if (groupOrOwnedValue === "unavailable") {
      throw new Error(
        "Trying to accept invite: Group/owned value unavailable from all peers",
      );
    }

    if (groupOrOwnedValue.core.header.ruleset.type === "ownedByGroup") {
      return this.acceptInvite(
        groupOrOwnedValue.core.header.ruleset.group as CoID<RawGroup>,
        inviteSecret,
      );
    } else if (groupOrOwnedValue.core.header.ruleset.type !== "group") {
      throw new Error("Can only accept invites to groups");
    }

    const group = expectGroup(groupOrOwnedValue);

    const inviteAgentSecret = this.crypto.agentSecretFromSecretSeed(
      secretSeedFromInviteSecret(inviteSecret),
    );
    const inviteAgentID = this.crypto.getAgentID(inviteAgentSecret);

    const inviteRole = await new Promise((resolve, reject) => {
      group.subscribe((groupUpdate) => {
        const role = groupUpdate.get(inviteAgentID);
        if (role) {
          resolve(role);
        }
      });
      setTimeout(
        () => reject(new Error("Couldn't find invite before timeout")),
        2000,
      );
    });

    if (!inviteRole) {
      throw new Error("No invite found");
    }

    const existingRole = group.get(this.account.id);

    if (
      existingRole === "admin" ||
      (existingRole === "writer" && inviteRole === "writerInvite") ||
      (existingRole === "writer" && inviteRole === "reader") ||
      (existingRole === "reader" && inviteRole === "readerInvite")
    ) {
      console.debug(
        "Not accepting invite that would replace or downgrade role",
      );
      return;
    }

    const groupAsInvite = expectGroup(
      group.core
        .testWithDifferentAccount(
          new ControlledAgent(inviteAgentSecret, this.crypto),
          this.crypto.newRandomSessionID(inviteAgentID),
        )
        .getCurrentContent(),
    );

    groupAsInvite.addMemberInternal(
      this.account,
      inviteRole === "adminInvite"
        ? "admin"
        : inviteRole === "writerInvite"
          ? "writer"
          : "reader",
    );

    group.core._sessionLogs = groupAsInvite.core.sessionLogs;
    group.core._cachedContent = undefined;

    for (const groupListener of group.core.listeners) {
      groupListener(group.core.getCurrentContent());
    }
  }

  /** @internal */
  expectCoValueLoaded(id: RawCoID, expectation?: string): CoValueCore {
    const entry = this.coValuesStore.get(id);

    if (entry.state.type !== "available") {
      throw new Error(
        `${expectation ? expectation + ": " : ""}CoValue ${id} not yet loaded. Current state: ${entry.state.type}`,
      );
    }
    return entry.state.coValue;
  }

  /** @internal */
  expectProfileLoaded(id: RawAccountID, expectation?: string): RawProfile {
    const account = this.expectCoValueLoaded(id, expectation);
    const profileID = expectGroup(account.getCurrentContent()).get("profile");
    if (!profileID) {
      throw new Error(
        `${expectation ? expectation + ": " : ""}Account ${id} has no profile`,
      );
    }
    return this.expectCoValueLoaded(
      profileID,
      expectation,
    ).getCurrentContent() as RawProfile;
  }

  /** @internal */
  createAccount(
    agentSecret = this.crypto.newRandomAgentSecret(),
  ): RawControlledAccount {
    const accountAgentID = this.crypto.getAgentID(agentSecret);
    const account = expectGroup(
      this.createCoValue(
        accountHeaderForInitialAgentSecret(agentSecret, this.crypto),
      )
        .testWithDifferentAccount(
          new ControlledAgent(agentSecret, this.crypto),
          this.crypto.newRandomSessionID(accountAgentID),
        )
        .getCurrentContent(),
    );

    account.set(accountAgentID, "admin", "trusting");

    const readKey = this.crypto.newRandomKeySecret();

    const sealed = this.crypto.seal({
      message: readKey.secret,
      from: this.crypto.getAgentSealerSecret(agentSecret),
      to: this.crypto.getAgentSealerID(accountAgentID),
      nOnceMaterial: {
        in: account.id,
        tx: account.core.nextTransactionID(),
      },
    });

    account.set(`${readKey.id}_for_${accountAgentID}`, sealed, "trusting");

    account.set("readKey", readKey.id, "trusting");

    const accountOnThisNode = this.expectCoValueLoaded(account.id);

    accountOnThisNode._sessionLogs = new Map(account.core.sessionLogs);

    accountOnThisNode._cachedContent = undefined;

    return new RawControlledAccount(accountOnThisNode, agentSecret);
  }

  /** @internal */
  resolveAccountAgent(
    id: RawAccountID | AgentID,
    expectation?: string,
  ): Result<AgentID, ResolveAccountAgentError> {
    if (isAgentID(id)) {
      return ok(id);
    }

    let coValue: CoValueCore;

    try {
      coValue = this.expectCoValueLoaded(id, expectation);
    } catch (e) {
      return err({
        type: "ErrorLoadingCoValueCore",
        expectation,
        id,
        error: e,
      } satisfies LoadCoValueCoreError);
    }

    if (
      coValue.header.type !== "comap" ||
      coValue.header.ruleset.type !== "group" ||
      !coValue.header.meta ||
      !("type" in coValue.header.meta) ||
      coValue.header.meta.type !== "account"
    ) {
      return err({
        type: "UnexpectedlyNotAccount",
        expectation,
        id,
      } satisfies UnexpectedlyNotAccountError);
    }

    return (coValue.getCurrentContent() as RawAccount).currentAgentID();
  }

  /**
   * @deprecated use Account.createGroup() instead
   */
  createGroup(
    uniqueness: CoValueUniqueness = this.crypto.createdNowUnique(),
  ): RawGroup {
    const groupCoValue = this.createCoValue({
      type: "comap",
      ruleset: { type: "group", initialAdmin: this.account.id },
      meta: null,
      ...uniqueness,
    });

    const group = expectGroup(groupCoValue.getCurrentContent());

    group.set(this.account.id, "admin", "trusting");

    const readKey = this.crypto.newRandomKeySecret();

    group.set(
      `${readKey.id}_for_${this.account.id}`,
      this.crypto.seal({
        message: readKey.secret,
        from: this.account.currentSealerSecret(),
        to: this.account
          .currentSealerID()
          ._unsafeUnwrap({ withStackTrace: true }),
        nOnceMaterial: {
          in: groupCoValue.id,
          tx: groupCoValue.nextTransactionID(),
        },
      }),
      "trusting",
    );

    group.set("readKey", readKey.id, "trusting");

    return group;
  }

  /** @internal */
  testWithDifferentAccount(
    account: ControlledAccountOrAgent,
    currentSessionID: SessionID,
  ): LocalNode {
    const newNode = new LocalNode(account, currentSessionID, this.crypto);

    const coValuesToCopy = Array.from(this.coValuesStore.getEntries());

    while (coValuesToCopy.length > 0) {
      const [coValueID, entry] = coValuesToCopy[coValuesToCopy.length - 1]!;

      if (entry.state.type !== "available") {
        coValuesToCopy.pop();
        continue;
      } else {
        const allDepsCopied = entry.state.coValue
          .getDependedOnCoValues()
          .every(
            (dep) => newNode.coValuesStore.get(dep).state.type === "available",
          );

        if (!allDepsCopied) {
          // move to end of queue
          coValuesToCopy.unshift(coValuesToCopy.pop()!);
          continue;
        }

        const newCoValue = new CoValueCore(
          entry.state.coValue.header,
          newNode,
          new Map(entry.state.coValue.sessionLogs),
        );

        newNode.coValuesStore.setAsAvailable(coValueID, newCoValue);

        coValuesToCopy.pop();
      }
    }

    if (account instanceof RawControlledAccount) {
      // To make sure that when we edit the account, we're modifying the correct sessions
      const accountInNode = new RawControlledAccount(
        newNode.expectCoValueLoaded(account.id),
        account.agentSecret,
      );
      if (accountInNode.core.node !== newNode) {
        throw new Error("Account's node is not the new node");
      }
      newNode.account = accountInNode;
    }

    return newNode;
  }

  gracefulShutdown() {
    for (const peer of Object.values(this.peers)) {
      peer.gracefulShutdown();
    }
  }
}

export type LoadCoValueCoreError = {
  type: "ErrorLoadingCoValueCore";
  error: unknown;
  expectation?: string;
  id: RawAccountID;
};

export type AccountUnavailableFromAllPeersError = {
  type: "AccountUnavailableFromAllPeers";
  expectation?: string;
  id: RawAccountID;
};

export type UnexpectedlyNotAccountError = {
  type: "UnexpectedlyNotAccount";
  expectation?: string;
  id: RawAccountID;
};

export type ResolveAccountAgentError =
  | InvalidAccountAgentIDError
  | LoadCoValueCoreError
  | AccountUnavailableFromAllPeersError
  | UnexpectedlyNotAccountError;
