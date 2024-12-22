import { Peer, PeerEntry, PeerID } from "./PeerEntry.js";
import {
  CoValueCore,
  CoValueHeader,
  SessionNewContent,
  isTryAddTransactionsException,
} from "./coValueCore.js";
import { CO_VALUE_LOADING_TIMEOUT, CoValueEntry } from "./coValueEntry.js";
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

export type DoneMessage = {
  action: "done";
  id: RawCoID;
};

export type DisconnectedError = "Disconnected";

export type PingTimeoutError = "PingTimeout";

export class SyncManager {
  local: LocalNode;
  requestedSyncs: {
    [id: RawCoID]:
      | { done: Promise<void>; nRequestsThisTick: number }
      | undefined;
  } = {};

  constructor(local: LocalNode) {
    this.local = local;
  }

  async handleSyncMessage(msg: SyncMessage, peer: PeerEntry) {
    // TODO errored coValues?
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
      return entry.getCoValue().then(async (value) => {
        if (value === "unavailable") {
          return respondWithEmptyData();
        } else {
          return peer.send.data({
            peerKnownState: msg,
            coValue: value,
          });
        }
      });
    }

    void respondWithEmptyData();

    // Initiate a new PULL flow
    // TODO maybe to send a PULL req if we have less data?
    // If the load request contains a header or any session data
    // we try to load it from the sender as well
    const peerToInclude =
      msg.header || Object.keys(msg.sessions).length > 0 ? peer : null;

    return this.loadCoValue(msg.id, peerToInclude?.id);
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

    const peers = this.local.peers.getInPriorityOrder({ excludedId: peer.id });

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
        ? void peer.send.pull({ knownState: coValue.knownState() })
        : void peer.send.ack({ knownState: coValue.knownState() });
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

    const peers = this.local.peers.getInPriorityOrder({ excludedId: peer.id });

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

  // async pullIncludingDependencies(coValue: CoValueCore, peer: PeerEntry) {
  //   for (const id of coValue.getDependedOnCoValues()) {
  //     const dependentCoValue = this.local.expectCoValueLoaded(id);
  //     await this.pullIncludingDependencies(dependentCoValue, peer);
  //   }
  //
  //   void peer.send.pull({ coValue });
  // }
  //
  async initialSync(peerData: Peer, peer: PeerEntry) {
    for (const entry of this.local.coValuesStore.getValues()) {
      const coValue = this.local.expectCoValueLoaded(entry.id);
      // TODO does it make sense to additionally pull dependencies now that we're sending all that we know from here ?
      // await this.pullIncludingDependencies(coValue, peer);

      // We send only push messages to be compatible  (load + content as previously), see transformOutgoingMessageToPeer()
      await peer.send.push({
        peerKnownState: emptyKnownState(entry.id),
        coValue,
      });
      entry.uploadState.setPendingForPeer(peerData.id);
    }
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

          await this.actuallySyncCoValue(coValue, peersKnownState, peers);
          resolve();
        });
      });

      this.requestedSyncs[coValue.id] = {
        done,
        nRequestsThisTick: 1,
      };
      return done;
    }
  }

  async actuallySyncCoValue(
    coValue: CoValueCore,
    peerKnownState: CoValueKnownState,
    peers?: PeerEntry[],
  ) {
    const peersToSync = peers || this.local.peers.getInPriorityOrder();
    for (const peer of peersToSync) {
      if (peer.erroredCoValues.has(coValue.id)) continue;

      await peer.send.push({
        peerKnownState,
        coValue,
      });
    }
    for (const peer of this.local.peers.getAll()) {
      const entry = this.local.coValuesStore.get(coValue.id);

      // invoke the internal promise to be resolved once an ack message arrives from the peer
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

  async loadCoValue(
    id: RawCoID,
    peerToIncludeId?: PeerID,
  ): Promise<CoValueCore | "unavailable"> {
    const entry = this.local.coValuesStore.get(id);

    if (entry.state.type === "unknown" || entry.state.type === "unavailable") {
      const peers = this.local.peers.getServerAndStorage({
        includedId: peerToIncludeId,
      });

      await entry
        .loadFromPeers(getPeersWithoutErrors(peers, id), loadCoValueFromPeers)
        .catch((e) => {
          console.error("Error loading from peers", id, e);
        });
    }

    return entry.getCoValue();
  }
}

function getPeersWithoutErrors(peers: PeerEntry[], coValueId: RawCoID) {
  return peers.filter((p) => {
    if (p.erroredCoValues.has(coValueId)) {
      console.error(
        `Skipping load on errored coValue ${coValueId} from peer ${p.id}`,
      );
      return false;
    }

    return true;
  });
}

async function loadCoValueFromPeers(
  coValueEntry: CoValueEntry,
  peers: PeerEntry[],
) {
  for (const peer of peers) {
    if (coValueEntry.state.type === "available") {
      void peer.send.pull({
        knownState: coValueEntry.state.coValue.knownState(),
      });
    } else {
      void peer.send.pull({ knownState: emptyKnownState(coValueEntry.id) });
    }

    if (coValueEntry.state.type === "loading") {
      const timeout = setTimeout(() => {
        if (coValueEntry.state.type === "loading") {
          console.error("Failed to load coValue from peer", peer.id);
          coValueEntry.dispatch({
            type: "not-found-in-peer",
            peerId: peer.id,
          });
        }
      }, CO_VALUE_LOADING_TIMEOUT);
      await coValueEntry.state.waitForPeer(peer.id);
      clearTimeout(timeout);
    }
  }
}
