import { PeerState } from "./PeerState.js";
import { CoValueCore } from "./coValueCore.js";
import { RawCoID } from "./ids.js";
import { PeerID } from "./sync.js";

export const CO_VALUE_LOADING_MAX_RETRIES = 5;

export class CoValueUnknownState {
  type = "unknown" as const;
}

export class CoValueLoadingState {
  type = "loading" as const;
  private peers = new Map<
    PeerID,
    ReturnType<typeof createResolvablePromise<void>>
  >();
  private resolve: (value: CoValueCore | "unavailable") => void;

  result: Promise<CoValueCore | "unavailable">;
  resolution: undefined | CoValueCore | "unavailable";

  constructor(peersIds: Iterable<PeerID>) {
    this.peers = new Map();

    for (const peerId of peersIds) {
      this.peers.set(peerId, createResolvablePromise<void>());
    }

    const { resolve, promise } = createResolvablePromise<
      CoValueCore | "unavailable"
    >();

    this.result = promise;
    this.resolve = resolve;
  }

  update(peerId: PeerID, value: CoValueCore | "unavailable") {
    const entry = this.peers.get(peerId);

    if (entry) {
      entry.resolve();
    }

    if (value !== "unavailable") {
      this.resolve(value);
      this.resolution = value;
      return;
    }

    this.peers.delete(peerId);

    // If none of the peers have the coValue, we resolve to unavailable
    if (this.peers.size === 0) {
      this.resolve("unavailable");
      this.resolution = "unavailable";
    }
  }

  // Wait for a specific peer to have a known state
  waitForPeer(peerId: PeerID) {
    const entry = this.peers.get(peerId);

    if (!entry) {
      return Promise.resolve();
    }

    return entry.promise;
  }
}

export class CoValueAvailableState {
  type = "available" as const;

  constructor(public coValue: CoValueCore) {}
}

export class CoValueUnavailableState {
  type = "unavailable" as const;
}

type CoValueStateAction =
  | {
      type: "not-found";
      peerId: PeerID;
    }
  | {
      type: "found";
      peerId: PeerID;
      coValue: CoValueCore;
    };

export class CoValueState {
  value: Promise<CoValueCore | "unavailable">;
  private resolve: (value: CoValueCore | "unavailable") => void = () => {};

  constructor(
    public id: RawCoID,
    public state:
      | CoValueUnknownState
      | CoValueLoadingState
      | CoValueAvailableState
      | CoValueUnavailableState,
  ) {
    if (state.type !== "available") {
      const { promise, resolve } = createResolvablePromise<
        CoValueCore | "unavailable"
      >();

      this.value = promise;
      this.resolve = resolve;
    } else {
      this.value = Promise.resolve(state.coValue);
    }
  }

  static Unknown(id: RawCoID) {
    return new CoValueState(id, new CoValueUnknownState());
  }

  static Loading(id: RawCoID, peersIds: Iterable<PeerID>) {
    return new CoValueState(id, new CoValueLoadingState(peersIds));
  }

  static Available(coValue: CoValueCore) {
    return new CoValueState(coValue.id, new CoValueAvailableState(coValue));
  }

  async loadFromPeers(peers: PeerState[]) {
    const state = this.state;

    // This method can only be called on unknown states
    // Otherwise it could mean that it's already loading, available or unavailable
    if (state.type !== "unknown") {
      return;
    }

    const doLoad = async (peersToLoadFrom: PeerState[]) => {
      const peersWithoutErrors = getPeersWithoutErrors(
        peersToLoadFrom,
        this.id,
      );

      // Set the state to loading and reset all the loading promises
      this.state = new CoValueLoadingState(peersWithoutErrors.map((p) => p.id));

      await loadCoValueFromPeers(this, peersWithoutErrors);

      const result = await this.state.result;

      return result !== "unavailable";
    };

    await doLoad(peers);

    if (this.state.type === "available") {
      return;
    }

    // Retry loading from peers that have the retry flag enabled
    const peersWithRetry = peers.filter((p) => p.retryUnavailableCoValues);

    if (peersWithRetry.length > 0) {
      await runWithRetry(
        () => doLoad(peersWithRetry),
        CO_VALUE_LOADING_MAX_RETRIES,
      );
    }

    // If after the retries the coValue is still loading, we mark it as unavailable
    if (this.state.type === "loading") {
      this.state = new CoValueUnavailableState();
      this.resolve("unavailable");
    }
  }

  dispatch(action: CoValueStateAction) {
    const state = this.state;

    if (state.type !== "loading") {
      return;
    }

    switch (action.type) {
      case "not-found":
        state.update(action.peerId, "unavailable");
        break;
      case "found":
        // When the coValue is found we move in the available state
        state.update(action.peerId, action.coValue);
        this.resolve(action.coValue);
        this.state = new CoValueAvailableState(action.coValue);
        break;
    }
  }
}

async function loadCoValueFromPeers(
  coValueEntry: CoValueState,
  peers: PeerState[],
) {
  for (const peer of peers) {
    await peer.pushOutgoingMessage({
      action: "load",
      id: coValueEntry.id,
      header: false,
      sessions: {},
    });

    if (coValueEntry.state.type === "loading") {
      await coValueEntry.state.waitForPeer(peer.id);
    }
  }
}

async function runWithRetry<T>(fn: () => Promise<T>, maxRetries: number) {
  let retries = 1;

  while (retries < maxRetries) {
    /**
     * With maxRetries of 5 we should wait:
     * 300ms
     * 900ms
     * 2700ms
     * 8100ms
     */
    await sleep(3 ** retries * 100);

    const result = await fn();

    if (result === true) {
      return;
    }

    retries++;
  }
}

function createResolvablePromise<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPeersWithoutErrors(peers: PeerState[], coValueId: RawCoID) {
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
