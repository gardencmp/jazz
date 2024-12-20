import {
  PriorityBasedMessageQueue,
  QueueEntry,
} from "./PriorityBasedMessageQueue.js";
import { TryAddTransactionsError } from "./coValueCore.js";
import { RawCoID } from "./ids.js";
import { PeerOperations } from "./peerOperations.js";
import { CO_VALUE_PRIORITY } from "./priority.js";
import { Peer, SyncMessage } from "./sync.js";
import { transformOutgoingMessageToPeer } from "./transformers.js";

// NOTE Renamed PeerState into PeerEntry
export class PeerEntry {
  private readonly ops: PeerOperations;

  constructor(private peer: Peer) {
    this.ops = new PeerOperations(this);
  }

  readonly erroredCoValues: Map<RawCoID, TryAddTransactionsError> = new Map();

  get id() {
    return this.peer.id;
  }

  get role() {
    return this.peer.role;
  }

  get priority() {
    return this.peer.priority;
  }

  get crashOnClose() {
    return this.peer.crashOnClose;
  }

  get send() {
    return this.ops;
  }

  shouldRetryUnavailableCoValues() {
    return this.peer.role === "server";
  }

  isServerOrStoragePeer() {
    return this.peer.role === "server" || this.peer.role === "storage";
  }

  /**
   * We set as default priority HIGH to handle all the messages without a
   * priority property as HIGH priority.
   *
   * This way we consider all the non-content messsages as HIGH priority.
   */
  private queue = new PriorityBasedMessageQueue(CO_VALUE_PRIORITY.HIGH);
  private processing = false;
  public closed = false;

  async processQueue() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    let entry: QueueEntry | undefined;
    while ((entry = this.queue.pull())) {
      // Awaiting the push to send one message at a time
      // This way when the peer is "under pressure" we can enqueue all
      // the coming messages and organize them by priority
      await this.peer.outgoing
        .push(entry.msg)
        .then(entry.resolve)
        .catch(entry.reject);
    }

    this.processing = false;
  }

  async pushOutgoingMessage(msg: SyncMessage) {
    if (this.closed) {
      return Promise.resolve();
    }

    const transformedMessages = transformOutgoingMessageToPeer(msg, this.id);
    transformedMessages.map((msg) => {
      console.log("🟢 <<<=== Sending to peer", this.id, msg);
    });

    try {
      return await Promise.all(
        transformedMessages.map((msg_3) => {
          const promise = this.queue.push(msg_3);

          void this.processQueue();

          return promise;
        }),
      );
    } catch (e) {
      console.error("Error sending to peer", this.id, transformedMessages, e);
    }
  }

  get incoming() {
    if (this.closed) {
      return (async function* () {
        yield "Disconnected" as const;
      })();
    }

    return this.peer.incoming;
  }

  private closeQueue() {
    let entry: QueueEntry | undefined;
    while ((entry = this.queue.pull())) {
      // Using resolve here to avoid unnecessary noise in the logs
      entry.resolve();
    }
  }

  gracefulShutdown() {
    console.debug("Gracefully closing", this.id);
    this.closeQueue();
    this.peer.outgoing.close();
    this.closed = true;
  }
}
