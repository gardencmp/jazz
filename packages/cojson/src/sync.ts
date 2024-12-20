import { PeerEntry } from "./PeerEntry.js";
import {
  CoValueHeader,
  Transaction,
  isTryAddTransactionsException,
} from "./coValueCore.js";
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

export type CoValueContent = {
  id: RawCoID;
  header?: CoValueHeader;
  priority: CoValuePriority;
  new: {
    [sessionID: SessionID]: SessionNewContent;
  };
};

export type NewContentMessage = {
  action: "content";
} & CoValueContent;

export type DataMessage = {
  known?: boolean;
  action: "data";
  asDependencyOf?: RawCoID;
} & CoValueContent;

export type PushMessage = {
  action: "push";
  asDependencyOf?: RawCoID;
} & CoValueContent;

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
  peers: { [key: PeerID]: PeerEntry } = {};
  local: LocalNode;
  requestedSyncs: {
    [id: RawCoID]:
      | { done: Promise<void>; nRequestsThisTick: number }
      | undefined;
  } = {};

  constructor(local: LocalNode) {
    this.local = local;
  }

  peersInPriorityOrder(): PeerEntry[] {
    return Object.values(this.peers).sort((a, b) => {
      const aPriority = a.priority || 0;
      const bPriority = b.priority || 0;

      return bPriority - aPriority;
    });
  }

  getPeers(): PeerEntry[] {
    return Object.values(this.peers);
  }

  getServerAndStoragePeers(excludePeerId?: PeerID): PeerEntry[] {
    return this.peersInPriorityOrder().filter(
      (peer) => peer.isServerOrStoragePeer() && peer.id !== excludePeerId,
    );
  }

  async handleSyncMessage(msg: SyncMessage, peer: PeerEntry) {
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

      default:
        throw new Error(
          `Unknown message type ${(msg as unknown as { action: "string" }).action}`,
        );
    }
  }

  async handlePull(msg: PullMessage, peer: PeerEntry) {
    const entry = this.local.coValuesStore.get(msg.id);

    const respondWithEmptyData = async () => {
      void peer.send.emptyData(msg.id);
    };

    if (entry.state.type === "available") {
      return peer.send.data({
        peerKnownState: msg,
        coValue: entry.state.coValue,
      });
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
            void respondWithEmptyData();
          } else {
            const sentAmount = await peer.send.data({
              peerKnownState: msg,
              coValue: value,
            });
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

    // TODO maybe to send a PULL req if we have less data?
    // Initiate a new PULL flow
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

  async handleData(msg: DataMessage, peer: PeerEntry) {
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
        peer.id,
        msg.id,
        '!!! We should never be here. "Data" action is a response to our specific request.',
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

    try {
      const anyMissedTransaction = coValue.addNewContent(msg);

      if (anyMissedTransaction) {
        console.error(
          peer.id,
          msg.id,
          '!!! We should never be here. "Data" action is a response to our specific request.',
        );
        return;
      }
    } catch (e) {
      if (isTryAddTransactionsException(e)) {
        const { message, error } = e;
        console.error(peer.id, message, error);

        peer.erroredCoValues.set(msg.id, error);
      } else {
        console.error("Unknown error", peer.id, e);
      }

      return;
    }

    const peers = this.peersInPriorityOrder().filter((p) => p.id !== peer.id);
    return this.syncCoValue(coValue, peerKnownState, peers);
  }

  async handlePush(msg: PushMessage, peer: PeerEntry) {
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
    try {
      const anyMissedTransaction = coValue.addNewContent(msg);

      anyMissedTransaction
        ? void peer.send.pull({ coValue })
        : void peer.send.ack({ coValue });
    } catch (e) {
      if (isTryAddTransactionsException(e)) {
        const { message, error } = e;
        console.error(peer.id, message, error);
        // TODO
      }
    }

    const peers = this.peersInPriorityOrder().filter((p) => p.id !== peer.id);
    await this.syncCoValue(coValue, peerKnownState, peers);
  }

  async handleAck(msg: AckMessage, peer: PeerEntry) {
    const entry = this.local.coValuesStore.get(msg.id);

    if (entry.state.type !== "available") {
      console.error(
        '!!! We should never be here. "Ack" action is a response to our specific request.',
      );
      return;
    }

    entry.uploadState.setCompletedForPeer(peer.id);
  }

  async pullIncludingDependencies(coValue: CoValueCore, peer: PeerEntry) {
    for (const id of coValue.getDependedOnCoValues()) {
      const dependentCoValue = this.local.expectCoValueLoaded(id);
      await this.pullIncludingDependencies(dependentCoValue, peer);
    }

    void peer.send.pull({ coValue });
  }

  addPeer(peerData: Peer) {
    const prevPeer = this.peers[peerData.id];
    const peer = new PeerEntry(peerData);
    this.peers[peerData.id] = peer;

    if (prevPeer && !prevPeer.closed) {
      prevPeer.gracefulShutdown();
    }

    if (peer.isServerOrStoragePeer()) {
      const initialSync = async () => {
        for (const entry of this.local.coValuesStore.getValues()) {
          const coValue = this.local.expectCoValueLoaded(entry.id);
          // TODO does it make sense to additionally pull dependencies now that we're sending all that we know from here ?
          await this.pullIncludingDependencies(coValue, peer);

          // We send only push messages to be compatible  (load + content as previously), see transformOutgoingMessageToPeer()
          await peer.send.push({
            peerKnownState: emptyKnownState(entry.id),
            coValue,
          });
          entry.uploadState.setPendingForPeer(peerData.id);
        }
      };
      void initialSync();
    }

    const processMessages = async () => {
      for await (const msg of peer.incoming) {
        if (msg === "Disconnected") {
          return;
        }
        if (msg === "PingTimeout") {
          console.error("Ping timeout from peer", peerData.id);
          return;
        }
        try {
          console.log("🔵 ===>>> Received from", peerData.id, msg);
          await this.handleSyncMessage(
            transformIncomingMessageFromPeer(msg, peerData.id),
            peer,
          );
        } catch (e) {
          throw new Error(
            `Error reading from peer ${
              peerData.id
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
        if (peerData.crashOnClose) {
          console.error("Unexepcted close from peer", peerData.id);
          this.local.crashed = new Error("Unexpected close from peer");
          throw new Error("Unexpected close from peer");
        }
      })
      .catch((e) => {
        console.error("Error processing messages from peer", peerData.id, e);
        if (peerData.crashOnClose) {
          this.local.crashed = e;
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

  async syncCoValue(
    coValue: CoValueCore,
    peersKnownState: CoValueKnownState,
    peers?: PeerEntry[],
  ) {
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
          await this.actuallySyncCoValue(coValue, peersKnownState, peers);
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
    peerKnownState: CoValueKnownState,
    peers?: PeerEntry[],
  ) {
    const peersToSync = peers || this.peersInPriorityOrder();
    for (const peer of peersToSync) {
      if (peer.closed) continue;
      if (peer.erroredCoValues.has(coValue.id)) continue;

      await peer.send.push({
        peerKnownState,
        coValue,
      });
    }
    for (const peer of this.getPeers()) {
      const entry = this.local.coValuesStore.get(coValue.id);

      // invoke the internal promise to be resolved when ack message comes from the peer
      entry.uploadState.setPendingForPeer(peer.id);
    }
  }

  async waitForUploadIntoPeer(peerId: PeerID, id: RawCoID) {
    const entry = this.local.coValuesStore.get(id);
    if (!entry) {
      throw new Error(`Unknown coValue ${id}`);
    }

    if (entry.uploadState.isCoValueFullyUploadedIntoPeer(peerId)) {
      return true;
    }

    return entry.uploadState.waitForPeer(peerId);
  }

  gracefulShutdown() {
    for (const peer of Object.values(this.peers)) {
      peer.gracefulShutdown();
    }
  }
}
