import { PeerKnownStateActions, PeerKnownStates } from "./PeerKnownStates.js";
import {
  PriorityBasedMessageQueue,
  QueueEntry,
} from "./PriorityBasedMessageQueue.js";
import { TryAddTransactionsError } from "./coValueCore.js";
import { RawCoID } from "./ids.js";
import { CO_VALUE_PRIORITY } from "./priority.js";
import { Peer, SyncMessage } from "./sync.js";

export class PeerState {
  constructor(
    private peer: Peer,
    knownStates: PeerKnownStates | undefined,
  ) {
    this.optimisticKnownStates = knownStates?.clone() ?? new PeerKnownStates();

    // We assume that exchanges with storage peers are always successful
    // hence we don't need to differentiate between knownStates and optimisticKnownStates
    if (peer.role === "storage") {
      this.knownStates = this.optimisticKnownStates;
    } else {
      this.knownStates = knownStates?.clone() ?? new PeerKnownStates();
    }
  }

  /**
   * Here we to collect all the known states that a given peer has told us about.
   *
   * This can be used to safely track the sync state of a coValue in a given peer.
   */
  readonly knownStates: PeerKnownStates;

  /**
   * This one collects the known states "optimistically".
   * We use it to keep track of the content we have sent to a given peer.
   *
   * The main difference with knownState is that this is updated when the content is sent to the peer without
   * waiting for any acknowledgement from the peer.
   */
  readonly optimisticKnownStates: PeerKnownStates;
  readonly toldKnownState: Set<RawCoID> = new Set();

  dispatchToKnownStates(action: PeerKnownStateActions) {
    this.knownStates.dispatch(action);

    if (this.role !== "storage") {
      this.optimisticKnownStates.dispatch(action);
    }
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

  pushOutgoingMessage(msg: SyncMessage) {
    if (this.closed) {
      return Promise.resolve();
    }

    const promise = this.queue.push(msg);

    void this.processQueue();

    return promise;
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
