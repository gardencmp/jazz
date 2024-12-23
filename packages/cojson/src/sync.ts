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
  // Is coValue known by peer
  header: boolean;
  // Number of known sessions
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
  known: boolean;
  action: "data";
  asDependencyOf?: RawCoID;
} & CoValueContent;

export type PushMessage = {
  action: "push";
  asDependencyOf?: RawCoID;
} & CoValueContent;

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

  /**
   * "Pull" request must be followed by "data" message response according to the protocol:
   * - Sends new content if it exists.
   * - Sends an empty data message otherwise.
   * - Sends an empty data message with `{ known: false }` in the message if the `coValue` is unknown by local node.
   *
   * Handler initiates a new "pull" requests to load the coValue from peers if it is not known by the node.
   *
   * @param msg - The state provided by the peer.
   * Any content created after this state is considered new and to be sent.
   * @param peer
   */
  async handlePull(msg: PullMessage, peer: PeerEntry): Promise<unknown> {
    const entry = this.local.coValuesStore.get(msg.id);

    if (entry.state.type === "available") {
      return peer.send.data({
        peerKnownState: msg,
        coValue: entry.state.coValue,
      });
    }

    if (entry.state.type === "loading") {
      // We need to return from handlePull immediately and wait for the CoValue to be loaded in a new task,
      // otherwise we might block further incoming content messages that would resolve the CoValue as available.
      return entry.getCoValue().then(() => this.handlePull(msg, peer));
    }

    void peer.send.data({ peerKnownState: msg, coValue: "unknown" });
    // If the coValue is known by peer then we try to load it from the sender as well
    const peerToInclude = msg.header ? peer : null;
    // Initiate a new PULL flow
    return this.loadCoValue(msg.id, peerToInclude?.id);
  }

  /**
   * "Data" is a response to our "pull" message. It's a terminal message which must not be responded to.
   * At this stage the coValue state is considered synced between the peer and the node.
   */
  async handleData(msg: DataMessage, peer: PeerEntry) {
    const entry = this.local.coValuesStore.get(msg.id);

    if (!msg.known) {
      entry.markAsNotFoundInPeer(peer.id);
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

      this.local.coValuesStore.setAsAvailable(msg.id, coValue);
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

      this.local.coValuesStore.setAsAvailable(msg.id, coValue);
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

  /**
   * Sends "push" request to peers to broadcast all known coValues state
   * and request to subscribe to those coValues updates (if have not)
   */
  async initialSync(peerData: Peer, peer: PeerEntry) {
    for (const entry of this.local.coValuesStore.getValues()) {
      const coValue = this.local.expectCoValueLoaded(entry.id);
      // TODO does it make sense to additionally pull dependencies now that we're sending all that we know from here ?
      // await this.pullIncludingDependencies(coValue, peer);

      // Previously we used to send load + content,  see transformOutgoingMessageToPeer()
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

  /**
   * Sends "push" request to peers to broadcast the new known coValue state and request to subscribe to updates if have not
   */
  async actuallySyncCoValue(
    coValue: CoValueCore,
    peerKnownState: CoValueKnownState,
    peers?: PeerEntry[],
  ) {
    const entry = this.local.coValuesStore.get(coValue.id);
    const peersToSync = peers || this.local.peers.getInPriorityOrder();

    for (const peer of peersToSync) {
      if (peer.erroredCoValues.has(coValue.id)) continue;

      await peer.send.push({
        peerKnownState,
        coValue,
      });

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

  /**
   * Sends "pull" request to peers to load/update the coValue state and request to subscribe to peer's updates if have not
   *
   * @param id
   * @param peerIdToInclude - Required peer to send the request to
   */
  async loadCoValue(
    id: RawCoID,
    peerIdToInclude?: PeerID,
  ): Promise<CoValueCore | "unavailable"> {
    const entry = this.local.coValuesStore.get(id);

    const peers = this.local.peers.getServerAndStorage({
      includedId: peerIdToInclude,
    });

    try {
      await entry.loadFromPeers(
        getPeersWithoutErrors(peers, id),
        loadCoValueFromPeers,
      );
    } catch (e) {
      console.error("Error loading from peers", id, e);
    }

    return entry.getCoValue();
  }
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
          coValueEntry.markAsNotFoundInPeer(peer.id);
        }
      }, CO_VALUE_LOADING_TIMEOUT);
      await coValueEntry.state.waitForPeer(peer.id);
      clearTimeout(timeout);
    }
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
