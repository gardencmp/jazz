import { PeerState } from "./PeerState.js";
import { SyncStateSubscriptionManager } from "./SyncStateSubscriptionManager.js";
import { CoValueHeader, Transaction } from "./coValueCore.js";
import { CoValueCore } from "./coValueCore.js";
import { Signature } from "./crypto/crypto.js";
import { RawCoID, SessionID } from "./ids.js";
import { LocalNode } from "./localNode.js";
import { CoValuePriority } from "./priority.js";
import { transformIncomingMessageFromPeer } from "./transformers.js";

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

export function emptyDataMessage(
  id: RawCoID,
  asDependencyOf?: RawCoID,
): DataMessage {
  const message: DataMessage = {
    id,
    known: false,
    action: "data",
    priority: 0,
    new: {},
  };
  return asDependencyOf ? { ...message, asDependencyOf } : message;
}

export type SyncMessage =
  | LoadMessage
  | KnownStateMessage
  | NewContentMessage
  | DoneMessage
  | PullMessage
  | PushMessage
  | AckMessage
  | DataMessage;

export type LoadMessage = {
  action: "load";
} & CoValueKnownState;

export type PullMessage = {
  action: "pull";
} & CoValueKnownState;

export type KnownStateMessage = {
  action: "known";
  asDependencyOf?: RawCoID;
  isCorrection?: boolean;
} & CoValueKnownState;

export type AckMessage = {
  action: "ack";
} & CoValueKnownState;

export type ContentMessage = {
  id: RawCoID;
  header?: CoValueHeader;
  priority: CoValuePriority;
  asDependencyOf?: RawCoID;
  new: {
    [sessionID: SessionID]: SessionNewContent;
  };
};

export type NewContentMessage = {
  action: "content";
} & ContentMessage;

export type DataMessage = {
  known?: boolean;
  action: "data";
} & ContentMessage;

export type PushMessage = {
  action: "push";
} & ContentMessage;

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

  constructor(local: LocalNode) {
    this.local = local;
    this.syncStateSubscriptionManager = new SyncStateSubscriptionManager(this);
  }

  syncStateSubscriptionManager: SyncStateSubscriptionManager;

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
    switch (msg.action) {
      case "data":
        return this.handleData(msg, peer);
      case "push":
        return this.handlePush(msg, peer);
      case "pull":
        return this.handlePull(msg, peer);
      case "ack":
        return this.handleAck(msg, peer);
      // case "load":
      //   return await this.handleLoad(msg, peer);
      case "known":
        if (msg.isCorrection) {
          return await this.handleCorrection(msg, peer);
        } else {
          return await this.handleKnownState(msg, peer);
        }
      case "done":
        return await this.handleUnsubscribe(msg);
      default:
        throw new Error(
          `Unknown message type ${(msg as unknown as { action: "string" }).action}`,
        );
    }
  }

  async handlePull(msg: PullMessage, peer: PeerState) {
    const entry = this.local.coValuesStore.get(msg.id);

    if (entry.state.type === "available") {
      // send "data" action as a response
      return this.sendNewContentIncludingDependencies(msg, peer, "data");
    }

    const respondWithEmptyData = async () => {
      void this.trySendToPeer(peer, emptyDataMessage(msg.id));
    };

    if (entry.state.type === "loading") {
      // We need to return from handleLoad immediately and wait for the CoValue to be loaded
      // in a new task, otherwise we might block further incoming content messages that would
      // resolve the CoValue as available. This can happen when we receive fresh
      // content from a client, but we are a server with our own upstream server(s)
      entry
        .getCoValue()
        .then(async (value) => {
          if (value === "unavailable") {
            void respondWithEmptyData();
          } else {
            const sentAmount = await this.sendNewContentIncludingDependencies(
              msg,
              peer,
              "data",
            );
            if (sentAmount) {
              void respondWithEmptyData();
            }
          }
        })
        .catch((e) => {
          void respondWithEmptyData();
          console.error("Error loading coValue in handleLoad loading state", e);
        });

      return;
    }

    void respondWithEmptyData();

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
  }

  async handleData(msg: DataMessage, peer: PeerState) {
    const entry = this.local.coValuesStore.get(msg.id);

    if (msg.known === false) {
      entry.dispatch({
        type: "not-found-in-peer",
        peerId: peer.id,
      });
      return;
    }

    if (!msg.header && entry.state.type !== "available") {
      console.error(
        '!!! We should never be here. "Data" action is a response to our specific request. TODO Log error. Fix this. Retry request',
      );
      return;
    }

    let coValue: CoValueCore;
    if (entry.state.type !== "available") {
      coValue = new CoValueCore(msg.header as CoValueHeader, this.local);

      entry.dispatch({
        type: "available",
        coValue,
      });
    } else {
      coValue = entry.state.coValue;
    }

    const peerKnownState = { ...coValue.knownState() };

    const hasMissedTransactions = this.addTransaction({
      msg,
      coValue,
      peer,
    });

    if (hasMissedTransactions) {
      console.error(
        '!!! We should never be here. "Data" action is a response to our specific request. Log error. Fix this. Retry request',
      );
      return;
    }

    // TODO exclude original peers to not to sync with
    await this.syncCoValue(coValue, peerKnownState);
  }

  async handlePush(msg: PushMessage, peer: PeerState) {
    const entry = this.local.coValuesStore.get(msg.id);

    let coValue: CoValueCore;

    if (entry.state.type !== "available") {
      if (!msg.header) {
        console.error("Expected header to be sent in first message");
        return;
      }

      coValue = new CoValueCore(msg.header, this.local);

      entry.dispatch({
        type: "available",
        coValue,
      });
    } else {
      coValue = entry.state.coValue;
    }

    const peerKnownState = { ...coValue.knownState() };
    const anyMissedTransactions = this.addTransaction({
      msg,
      coValue,
      peer,
    });

    if (anyMissedTransactions) {
      this.trySendToPeer(peer, {
        action: "pull",
        ...coValue.knownState(),
      }).catch((e) => {
        console.error("Error sending msg", msg, e);
      });
    } else {
      this.trySendToPeer(peer, {
        action: "ack",
        ...coValue.knownState(),
      }).catch((e: unknown) => {
        console.error("Error sending", msg, e);
      });
    }
    // TODO exclude original peers to not to sync with
    await this.syncCoValue(coValue, peerKnownState);
  }

  async handleAck(msg: AckMessage, peer: PeerState) {
    const entry = this.local.coValuesStore.get(msg.id);

    if (entry.state.type !== "available") {
      console.error(
        '!!! We should never be here. "Ack" action is a response to our specific request. Log error. Fix this. Retry request',
      );
      return;
    }

    // TODO if we need it - set loadedOnPeer flag on in the entry to use in waitForUploadIntoPeer
  }

  async subscribeToIncludingDependencies(id: RawCoID, peer: PeerState) {
    const entry = this.local.coValuesStore.get(id);

    if (entry.state.type !== "available") {
      entry.loadFromPeers([peer]).catch((e: unknown) => {
        console.error("Error sending pull", e);
      });
      return;
    }

    const coValue = entry.state.coValue;

    for (const id of coValue.getDependedOnCoValues()) {
      await this.subscribeToIncludingDependencies(id, peer);
    }

    this.trySendToPeer(peer, {
      action: "pull",
      ...coValue.knownState(),
    }).catch((e: unknown) => {
      console.error("Error sending load", e);
    });
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

  async sendNewContentIncludingDependencies(
    known: CoValueKnownState,
    peer: PeerState,
    action?: "push" | "data",
  ) {
    const coValue = this.local.expectCoValueLoaded(known.id);

    // TODO probably, dependencies don't have new data? Do we really need it within the new algorythm
    // await Promise.all(
    //   coValue
    //     .getDependedOnCoValues()
    //     .map((id) => this.sendNewContentIncludingDependencies(id, peer)),
    // );

    const newContentPieces = coValue.newContentSince(known);

    if (newContentPieces) {
      const sendPieces = async () => {
        let lastYield = performance.now();
        for (const [_i, piece] of newContentPieces.entries()) {
          // console.log(
          //     `${id} -> ${peer.id}: Sending content piece ${i + 1}/${
          //         newContentPieces.length
          //     } header: ${!!piece.header}`,
          //     // Object.values(piece.new).map((s) => s.newTransactions)
          // );

          // TODO remove this when done
          const msg = {
            ...piece,
          };
          if (action) {
            // @ts-ignore
            msg.action = action;
          }
          this.trySendToPeer(peer, piece as SyncMessage).catch((e: unknown) => {
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
        return this.sendNewContentIncludingDependencies(known, peer, action);
      });
    }

    return newContentPieces?.length || 0;
  }

  addPeer(peer: Peer) {
    const prevPeer = this.peers[peer.id];
    const peerState = new PeerState(peer);
    this.peers[peer.id] = peerState;

    if (prevPeer && !prevPeer.closed) {
      prevPeer.gracefulShutdown();
    }

    if (peerState.isServerOrStoragePeer()) {
      const initialSync = async () => {
        for (const entry of this.local.coValuesStore.getValues()) {
          // TODO here
          await this.subscribeToIncludingDependencies(entry.id, peerState);

          if (entry.state.type === "available") {
            // TODO here
            await this.sendNewContentIncludingDependencies(
              emptyKnownState(entry.id),
              peerState,
            );
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
          console.log("🔵 ===>>> Received from", peer.id, msg);
          await this.handleSyncMessage(
            transformIncomingMessageFromPeer(msg, peer.id),
            peerState,
          );
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

        if (peer.deletePeerStateOnClose) {
          delete this.peers[peer.id];
        }
      });
  }

  trySendToPeer(peer: PeerState, msg: SyncMessage) {
    return peer.pushOutgoingMessage(msg);
  }

  async handleKnownState(msg: KnownStateMessage, peer: PeerState) {
    const entry = this.local.coValuesStore.get(msg.id);

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
      // TODO msg.known
      if (!msg.header) {
        entry.dispatch({
          type: "not-found-in-peer",
          peerId: peer.id,
        });
      }

      return;
    }

    if (entry.state.type === "available") {
      await this.tellUntoldKnownStateIncludingDependencies(msg.id, peer);
      await this.sendNewContentIncludingDependencies(msg, peer);
    }
  }

  private addTransaction({
    msg,
    coValue,
    peer,
  }: {
    msg: NewContentMessage | ContentMessage;
    coValue: CoValueCore;
    peer: PeerState;
  }) {
    let isMissingTransactions = false;

    for (const [sessionID, newContentForSession] of Object.entries(msg.new) as [
      SessionID,
      SessionNewContent,
    ][]) {
      const ourKnownTxIdx =
        coValue.sessionLogs.get(sessionID)?.transactions.length;
      const theirFirstNewTxIdx = newContentForSession.after;

      if ((ourKnownTxIdx || 0) < theirFirstNewTxIdx) {
        isMissingTransactions = true;
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
    }

    return isMissingTransactions;
  }

  async handleCorrection(msg: KnownStateMessage, peer: PeerState) {
    return this.sendNewContentIncludingDependencies(msg, peer);
  }

  handleUnsubscribe(_msg: DoneMessage) {
    throw new Error("Method not implemented.");
  }

  async syncCoValue(coValue: CoValueCore, peersKnownState: CoValueKnownState) {
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
          await this.actuallySyncCoValue(coValue, peersKnownState);
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

  async actuallySyncCoValue(
    coValue: CoValueCore,
    peersKnownState: CoValueKnownState,
  ) {
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
      await this.sendNewContentIncludingDependencies(
        peersKnownState,
        peer,
        "push",
      );
    }
  }

  // FIXME
  // async waitForUploadIntoPeer(peerId: PeerID, id: RawCoID) {
  //   const isAlreadyUploaded =
  //     this.syncStateSubscriptionManager.getIsCoValueFullyUploadedIntoPeer(
  //       peerId,
  //       id,
  //     );
  //
  //   if (isAlreadyUploaded) {
  //     return true;
  //   }
  //
  //   return new Promise((resolve) => {
  //     const unsubscribe =
  //       this.syncStateSubscriptionManager.subscribeToPeerUpdates(
  //         peerId,
  //         (knownState, syncState) => {
  //           if (syncState.isUploaded && knownState.id === id) {
  //             resolve(true);
  //             unsubscribe?.();
  //           }
  //         },
  //       );
  //   });
  // }

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
