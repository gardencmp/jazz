import { ValueType, metrics } from "@opentelemetry/api";
import { PeerState } from "./PeerState.js";
import { SyncStateManager } from "./SyncStateManager.js";
import { CoValueHeader, Transaction } from "./coValueCore.js";
import { CoValueCore } from "./coValueCore.js";
import { Signature } from "./crypto/crypto.js";
import { RawCoID, SessionID } from "./ids.js";
import { LocalNode } from "./localNode.js";
import { CoValuePriority } from "./priority.js";

export type CoValueKnownState = {
  id: RawCoID;
  header: boolean;
  sessions: { [sessionID: SessionID]: number };
};

export function emptyKnownState(id: RawCoID): CoValueKnownState {
  return {
    id,
    header: false,
    sessions: {},
  };
}

export type SyncMessage =
  | LoadMessage
  | KnownStateMessage
  | NewContentMessage
  | DoneMessage;

export type LoadMessage = {
  action: "load";
} & CoValueKnownState;

export type KnownStateMessage = {
  action: "known";
  asDependencyOf?: RawCoID;
  isCorrection?: boolean;
} & CoValueKnownState;

export type NewContentMessage = {
  action: "content";
  id: RawCoID;
  header?: CoValueHeader;
  priority: CoValuePriority;
  new: {
    [sessionID: SessionID]: SessionNewContent;
  };
};

export type SessionNewContent = {
  after: number;
  newTransactions: Transaction[];
  lastSignature: Signature;
};
export type DoneMessage = {
  action: "done";
  id: RawCoID;
};

export type PeerID = string;

export type DisconnectedError = "Disconnected";

export type PingTimeoutError = "PingTimeout";

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

export function combinedKnownStates(
  stateA: CoValueKnownState,
  stateB: CoValueKnownState,
): CoValueKnownState {
  const sessionStates: CoValueKnownState["sessions"] = {};

  const allSessions = new Set([
    ...Object.keys(stateA.sessions),
    ...Object.keys(stateB.sessions),
  ] as SessionID[]);

  for (const sessionID of allSessions) {
    const stateAValue = stateA.sessions[sessionID];
    const stateBValue = stateB.sessions[sessionID];

    sessionStates[sessionID] = Math.max(stateAValue || 0, stateBValue || 0);
  }

  return {
    id: stateA.id,
    header: stateA.header || stateB.header,
    sessions: sessionStates,
  };
}

export class SyncManager {
  peers: { [key: PeerID]: PeerState } = {};
  local: LocalNode;
  requestedSyncs: {
    [id: RawCoID]:
      | { done: Promise<void>; nRequestsThisTick: number }
      | undefined;
  } = {};

  peersCounter = metrics.getMeter("cojson").createUpDownCounter("jazz.peers", {
    description: "Amount of connected peers",
    valueType: ValueType.INT,
    unit: "peer",
  });

  constructor(local: LocalNode) {
    this.local = local;
    this.syncState = new SyncStateManager(this);
  }

  syncState: SyncStateManager;

  peersInPriorityOrder(): PeerState[] {
    return Object.values(this.peers).sort((a, b) => {
      const aPriority = a.priority || 0;
      const bPriority = b.priority || 0;

      return bPriority - aPriority;
    });
  }

  getPeers(): PeerState[] {
    return Object.values(this.peers);
  }

  getServerAndStoragePeers(excludePeerId?: PeerID): PeerState[] {
    return this.peersInPriorityOrder().filter(
      (peer) => peer.isServerOrStoragePeer() && peer.id !== excludePeerId,
    );
  }

  async handleSyncMessage(msg: SyncMessage, peer: PeerState) {
    if (peer.erroredCoValues.has(msg.id)) {
      console.error(
        `Skipping message ${msg.action} on errored coValue ${msg.id} from peer ${peer.id}`,
      );
      return;
    }
    // TODO: validate
    switch (msg.action) {
      case "load":
        return await this.handleLoad(msg, peer);
      case "known":
        if (msg.isCorrection) {
          return await this.handleCorrection(msg, peer);
        } else {
          return await this.handleKnownState(msg, peer);
        }
      case "content":
        // await new Promise<void>((resolve) => setTimeout(resolve, 0));
        return await this.handleNewContent(msg, peer);
      case "done":
        return await this.handleUnsubscribe(msg);
      default:
        throw new Error(
          `Unknown message type ${(msg as { action: "string" }).action}`,
        );
    }
  }

  async subscribeToIncludingDependencies(id: RawCoID, peer: PeerState) {
    const entry = this.local.coValuesStore.get(id);

    if (entry.state.type !== "available") {
      entry.loadFromPeers([peer]).catch((e: unknown) => {
        console.error("Error sending load", e);
      });
      return;
    }

    const coValue = entry.state.coValue;

    for (const id of coValue.getDependedOnCoValues()) {
      await this.subscribeToIncludingDependencies(id, peer);
    }

    if (!peer.toldKnownState.has(id)) {
      peer.toldKnownState.add(id);
      this.trySendToPeer(peer, {
        action: "load",
        ...coValue.knownState(),
      }).catch((e: unknown) => {
        console.error("Error sending load", e);
      });
    }
  }

  async tellUntoldKnownStateIncludingDependencies(
    id: RawCoID,
    peer: PeerState,
    asDependencyOf?: RawCoID,
  ) {
    const coValue = this.local.expectCoValueLoaded(id);

    await Promise.all(
      coValue
        .getDependedOnCoValues()
        .map((dependentCoID) =>
          this.tellUntoldKnownStateIncludingDependencies(
            dependentCoID,
            peer,
            asDependencyOf || id,
          ),
        ),
    );

    if (!peer.toldKnownState.has(id)) {
      this.trySendToPeer(peer, {
        action: "known",
        asDependencyOf,
        ...coValue.knownState(),
      }).catch((e: unknown) => {
        console.error("Error sending known state", e);
      });

      peer.toldKnownState.add(id);
    }
  }

  async sendNewContentIncludingDependencies(id: RawCoID, peer: PeerState) {
    const coValue = this.local.expectCoValueLoaded(id);

    await Promise.all(
      coValue
        .getDependedOnCoValues()
        .map((id) => this.sendNewContentIncludingDependencies(id, peer)),
    );

    const newContentPieces = coValue.newContentSince(
      peer.optimisticKnownStates.get(id),
    );

    if (newContentPieces) {
      const optimisticKnownStateBefore =
        peer.optimisticKnownStates.get(id) || emptyKnownState(id);

      const sendPieces = async () => {
        let lastYield = performance.now();
        for (const [_i, piece] of newContentPieces.entries()) {
          // console.log(
          //     `${id} -> ${peer.id}: Sending content piece ${i + 1}/${
          //         newContentPieces.length
          //     } header: ${!!piece.header}`,
          //     // Object.values(piece.new).map((s) => s.newTransactions)
          // );

          this.trySendToPeer(peer, piece).catch((e: unknown) => {
            console.error("Error sending content piece", e);
          });

          if (performance.now() - lastYield > 10) {
            await new Promise<void>((resolve) => {
              setTimeout(resolve, 0);
            });
            lastYield = performance.now();
          }
        }
      };

      sendPieces().catch((e) => {
        console.error("Error sending new content piece, retrying", e);
        peer.optimisticKnownStates.dispatch({
          type: "SET",
          id,
          value: optimisticKnownStateBefore ?? emptyKnownState(id),
        });
        return this.sendNewContentIncludingDependencies(id, peer);
      });

      peer.optimisticKnownStates.dispatch({
        type: "COMBINE_WITH",
        id,
        value: coValue.knownState(),
      });
    }
  }

  addPeer(peer: Peer) {
    const prevPeer = this.peers[peer.id];
    const peerState = new PeerState(peer, prevPeer?.knownStates);
    this.peers[peer.id] = peerState;

    if (prevPeer && !prevPeer.closed) {
      prevPeer.gracefulShutdown();
    }

    this.peersCounter.add(1, { role: peer.role });

    const unsubscribeFromKnownStatesUpdates = peerState.knownStates.subscribe(
      (id) => {
        this.syncState.triggerUpdate(peer.id, id);
      },
    );

    if (peerState.isServerOrStoragePeer()) {
      const initialSync = async () => {
        for (const entry of this.local.coValuesStore.getValues()) {
          await this.subscribeToIncludingDependencies(entry.id, peerState);

          if (entry.state.type === "available") {
            await this.sendNewContentIncludingDependencies(entry.id, peerState);
          }

          if (!peerState.optimisticKnownStates.has(entry.id)) {
            peerState.optimisticKnownStates.dispatch({
              type: "SET_AS_EMPTY",
              id: entry.id,
            });
          }
        }
      };
      void initialSync();
    }

    const processMessages = async () => {
      for await (const msg of peerState.incoming) {
        if (msg === "Disconnected") {
          return;
        }
        if (msg === "PingTimeout") {
          console.error("Ping timeout from peer", peer.id);
          return;
        }
        try {
          await this.handleSyncMessage(msg, peerState);
        } catch (e) {
          throw new Error(
            `Error reading from peer ${
              peer.id
            }, handling msg\n\n${JSON.stringify(msg, (k, v) =>
              k === "changes" || k === "encryptedChanges"
                ? v.slice(0, 20) + "..."
                : v,
            )}`,
            { cause: e },
          );
        }
      }
    };

    processMessages()
      .then(() => {
        if (peer.crashOnClose) {
          console.error("Unexepcted close from peer", peer.id);
          this.local.crashed = new Error("Unexpected close from peer");
          throw new Error("Unexpected close from peer");
        }
      })
      .catch((e) => {
        console.error("Error processing messages from peer", peer.id, e);
        if (peer.crashOnClose) {
          this.local.crashed = e;
          throw new Error(e);
        }
      })
      .finally(() => {
        const state = this.peers[peer.id];
        state?.gracefulShutdown();
        unsubscribeFromKnownStatesUpdates();
        this.peersCounter.add(-1, { role: peer.role });

        if (peer.deletePeerStateOnClose) {
          delete this.peers[peer.id];
        }
      });
  }

  trySendToPeer(peer: PeerState, msg: SyncMessage) {
    return peer.pushOutgoingMessage(msg);
  }

  async handleLoad(msg: LoadMessage, peer: PeerState) {
    peer.dispatchToKnownStates({
      type: "SET",
      id: msg.id,
      value: knownStateIn(msg),
    });
    const entry = this.local.coValuesStore.get(msg.id);

    if (entry.state.type === "unknown" || entry.state.type === "unavailable") {
      const eligiblePeers = this.getServerAndStoragePeers(peer.id);

      if (eligiblePeers.length === 0) {
        // If the load request contains a header or any session data
        // and we don't have any eligible peers to load the coValue from
        // we try to load it from the sender because it is the only place
        // where we can get informations about the coValue
        if (msg.header || Object.keys(msg.sessions).length > 0) {
          entry.loadFromPeers([peer]).catch((e) => {
            console.error("Error loading coValue in handleLoad", e);
          });
        }
        return;
      } else {
        this.local.loadCoValueCore(msg.id, peer.id).catch((e) => {
          console.error("Error loading coValue in handleLoad", e);
        });
      }
    }

    if (entry.state.type === "loading") {
      // We need to return from handleLoad immediately and wait for the CoValue to be loaded
      // in a new task, otherwise we might block further incoming content messages that would
      // resolve the CoValue as available. This can happen when we receive fresh
      // content from a client, but we are a server with our own upstream server(s)
      entry
        .getCoValue()
        .then(async (value) => {
          if (value === "unavailable") {
            peer.dispatchToKnownStates({
              type: "SET",
              id: msg.id,
              value: knownStateIn(msg),
            });
            peer.toldKnownState.add(msg.id);

            this.trySendToPeer(peer, {
              action: "known",
              id: msg.id,
              header: false,
              sessions: {},
            }).catch((e) => {
              console.error("Error sending known state back", e);
            });

            return;
          }

          await this.tellUntoldKnownStateIncludingDependencies(msg.id, peer);
          await this.sendNewContentIncludingDependencies(msg.id, peer);
        })
        .catch((e) => {
          console.error("Error loading coValue in handleLoad loading state", e);
        });
    }

    if (entry.state.type === "available") {
      await this.tellUntoldKnownStateIncludingDependencies(msg.id, peer);
      await this.sendNewContentIncludingDependencies(msg.id, peer);
    }
  }

  async handleKnownState(msg: KnownStateMessage, peer: PeerState) {
    const entry = this.local.coValuesStore.get(msg.id);

    peer.dispatchToKnownStates({
      type: "COMBINE_WITH",
      id: msg.id,
      value: knownStateIn(msg),
    });

    if (entry.state.type === "unknown" || entry.state.type === "unavailable") {
      if (msg.asDependencyOf) {
        const dependencyEntry = this.local.coValuesStore.get(
          msg.asDependencyOf,
        );

        if (
          dependencyEntry.state.type === "available" ||
          dependencyEntry.state.type === "loading"
        ) {
          this.local
            .loadCoValueCore(
              msg.id,
              peer.role === "storage" ? undefined : peer.id,
            )
            .catch((e) => {
              console.error(
                `Error loading coValue ${msg.id} to create loading state, as dependency of ${msg.asDependencyOf}`,
                e,
              );
            });
        }
      }
    }

    // The header is a boolean value that tells us if the other peer do have information about the header.
    // If it's false in this point it means that the coValue is unavailable on the other peer.
    if (entry.state.type !== "available") {
      const availableOnPeer = peer.optimisticKnownStates.get(msg.id)?.header;

      if (!availableOnPeer) {
        entry.dispatch({
          type: "not-found-in-peer",
          peerId: peer.id,
        });
      }

      return;
    }

    if (entry.state.type === "available") {
      await this.tellUntoldKnownStateIncludingDependencies(msg.id, peer);
      await this.sendNewContentIncludingDependencies(msg.id, peer);
    }
  }

  async handleNewContent(msg: NewContentMessage, peer: PeerState) {
    const entry = this.local.coValuesStore.get(msg.id);

    let coValue: CoValueCore;

    if (entry.state.type !== "available") {
      if (!msg.header) {
        console.error("Expected header to be sent in first message");
        return;
      }

      peer.dispatchToKnownStates({
        type: "UPDATE_HEADER",
        id: msg.id,
        header: true,
      });

      coValue = new CoValueCore(msg.header, this.local);

      entry.dispatch({
        type: "available",
        coValue,
      });
    } else {
      coValue = entry.state.coValue;
    }

    let invalidStateAssumed = false;

    for (const [sessionID, newContentForSession] of Object.entries(msg.new) as [
      SessionID,
      SessionNewContent,
    ][]) {
      const ourKnownTxIdx =
        coValue.sessionLogs.get(sessionID)?.transactions.length;
      const theirFirstNewTxIdx = newContentForSession.after;

      if ((ourKnownTxIdx || 0) < theirFirstNewTxIdx) {
        invalidStateAssumed = true;
        continue;
      }

      const alreadyKnownOffset = ourKnownTxIdx
        ? ourKnownTxIdx - theirFirstNewTxIdx
        : 0;

      const newTransactions =
        newContentForSession.newTransactions.slice(alreadyKnownOffset);

      if (newTransactions.length === 0) {
        continue;
      }

      const before = performance.now();
      // eslint-disable-next-line neverthrow/must-use-result
      const result = coValue.tryAddTransactions(
        sessionID,
        newTransactions,
        undefined,
        newContentForSession.lastSignature,
      );
      const after = performance.now();
      if (after - before > 80) {
        const totalTxLength = newTransactions
          .map((t) =>
            t.privacy === "private"
              ? t.encryptedChanges.length
              : t.changes.length,
          )
          .reduce((a, b) => a + b, 0);
        console.log(
          `Adding incoming transactions took ${(after - before).toFixed(
            2,
          )}ms for ${totalTxLength} bytes = bandwidth: ${(
            (1000 * totalTxLength) / (after - before) / (1024 * 1024)
          ).toFixed(2)} MB/s`,
        );
      }

      // const theirTotalnTxs = Object.values(
      //     peer.optimisticKnownStates[msg.id]?.sessions || {},
      // ).reduce((sum, nTxs) => sum + nTxs, 0);
      // const ourTotalnTxs = [...coValue.sessionLogs.values()].reduce(
      //     (sum, session) => sum + session.transactions.length,
      //     0,
      // );

      if (result.isErr()) {
        console.error(
          "Failed to add transactions from",
          peer.id,
          result.error,
          msg.id,
          newTransactions.length + " new transactions",
          "after: " + newContentForSession.after,
          "our last known tx idx initially: " + ourKnownTxIdx,
          "our last known tx idx now: " +
            coValue.sessionLogs.get(sessionID)?.transactions.length,
        );
        peer.erroredCoValues.set(msg.id, result.error);
        continue;
      }

      peer.dispatchToKnownStates({
        type: "UPDATE_SESSION_COUNTER",
        id: msg.id,
        sessionId: sessionID,
        value:
          newContentForSession.after +
          newContentForSession.newTransactions.length,
      });
    }

    if (invalidStateAssumed) {
      this.trySendToPeer(peer, {
        action: "known",
        isCorrection: true,
        ...coValue.knownState(),
      }).catch((e) => {
        console.error("Error sending known state correction", e);
      });
    } else {
      /**
       * We are sending a known state message to the peer to acknowledge the
       * receipt of the new content.
       *
       * This way the sender knows that the content has been received and applied
       * and can update their peer's knownState accordingly.
       */
      this.trySendToPeer(peer, {
        action: "known",
        ...coValue.knownState(),
      }).catch((e: unknown) => {
        console.error("Error sending known state", e);
      });
    }

    /**
     * We do send a correction/ack message before syncing to give an immediate
     * response to the peers that are waiting for confirmation that a coValue is
     * fully synced
     */
    await this.syncCoValue(coValue);
  }

  async handleCorrection(msg: KnownStateMessage, peer: PeerState) {
    peer.dispatchToKnownStates({
      type: "SET",
      id: msg.id,
      value: knownStateIn(msg),
    });

    return this.sendNewContentIncludingDependencies(msg.id, peer);
  }

  handleUnsubscribe(_msg: DoneMessage) {
    throw new Error("Method not implemented.");
  }

  async syncCoValue(coValue: CoValueCore) {
    if (this.requestedSyncs[coValue.id]) {
      this.requestedSyncs[coValue.id]!.nRequestsThisTick++;
      return this.requestedSyncs[coValue.id]!.done;
    } else {
      const done = new Promise<void>((resolve) => {
        queueMicrotask(async () => {
          delete this.requestedSyncs[coValue.id];
          // if (entry.nRequestsThisTick >= 2) {
          //     console.log("Syncing", coValue.id, "for", entry.nRequestsThisTick, "requests");
          // }
          await this.actuallySyncCoValue(coValue);
          resolve();
        });
      });
      const entry = {
        done,
        nRequestsThisTick: 1,
      };
      this.requestedSyncs[coValue.id] = entry;
      return done;
    }
  }

  async actuallySyncCoValue(coValue: CoValueCore) {
    // let blockingSince = performance.now();
    for (const peer of this.peersInPriorityOrder()) {
      if (peer.closed) continue;
      if (peer.erroredCoValues.has(coValue.id)) continue;
      // if (performance.now() - blockingSince > 5) {
      //     await new Promise<void>((resolve) => {
      //         setTimeout(resolve, 0);
      //     });
      //     blockingSince = performance.now();
      // }
      if (peer.optimisticKnownStates.has(coValue.id)) {
        await this.tellUntoldKnownStateIncludingDependencies(coValue.id, peer);
        await this.sendNewContentIncludingDependencies(coValue.id, peer);
      } else if (peer.isServerOrStoragePeer()) {
        await this.subscribeToIncludingDependencies(coValue.id, peer);
        await this.sendNewContentIncludingDependencies(coValue.id, peer);
      }
    }

    for (const peer of this.getPeers()) {
      this.syncState.triggerUpdate(peer.id, coValue.id);
    }
  }

  async waitForSyncWithPeer(peerId: PeerID, id: RawCoID, timeout: number) {
    const { syncState } = this;
    const currentSyncState = syncState.getCurrentSyncState(peerId, id);

    const isTheConditionAlreadyMet = currentSyncState.uploaded;

    if (isTheConditionAlreadyMet) {
      return true;
    }

    return new Promise((resolve, reject) => {
      const unsubscribe = this.syncState.subscribeToPeerUpdates(
        peerId,
        (knownState, syncState) => {
          if (syncState.uploaded && knownState.id === id) {
            resolve(true);
            unsubscribe?.();
            clearTimeout(timeoutId);
          }
        },
      );

      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for sync on ${peerId}/${id}`));
        unsubscribe?.();
      }, timeout);
    });
  }

  async waitForSync(id: RawCoID, timeout = 30_000) {
    const peers = this.getPeers();

    return Promise.all(
      peers.map((peer) => this.waitForSyncWithPeer(peer.id, id, timeout)),
    );
  }

  async waitForAllCoValuesSync(timeout = 60_000) {
    const coValues = this.local.coValuesStore.getValues();
    const validCoValues = Array.from(coValues).filter(
      (coValue) =>
        coValue.state.type === "available" || coValue.state.type === "loading",
    );

    return Promise.all(
      validCoValues.map((coValue) => this.waitForSync(coValue.id, timeout)),
    );
  }

  gracefulShutdown() {
    for (const peer of Object.values(this.peers)) {
      peer.gracefulShutdown();
    }
  }
}

function knownStateIn(msg: LoadMessage | KnownStateMessage) {
  return {
    id: msg.id,
    header: msg.header,
    sessions: msg.sessions,
  };
}
