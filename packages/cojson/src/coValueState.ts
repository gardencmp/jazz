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

      for (const entry of this.peers.values()) {
        entry.resolve();
      }

      this.peers.clear();

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
      type: "load-requested";
      peersIds: PeerID[];
    }
  | {
      type: "load-failed";
    }
  | {
      type: "not-found-in-peer";
      peerId: PeerID;
    }
  | {
      type: "found-in-peer";
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
    if (state.type === "unknown" || state.type === "loading") {
      const { promise, resolve } = createResolvablePromise<
        CoValueCore | "unavailable"
      >();

      this.value = promise;
      this.resolve = resolve;
    } else if (state.type === "available") {
      this.value = Promise.resolve(state.coValue);
    } else {
      this.value = Promise.resolve("unavailable");
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

  static Unavailable(id: RawCoID) {
    return new CoValueState(id, new CoValueUnavailableState());
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
      const currentState = this.dispatch({
        type: "load-requested",
        peersIds: peersWithoutErrors.map((p) => p.id),
      });

      // If we entered successfully the loading state, we load the coValue from the peers
      //
      // We may not enter the loading state if the coValue has become available in between
      // of the retries
      if (currentState.type === "loading") {
        await loadCoValueFromPeers(this, peersWithoutErrors);

        const result = await currentState.result;
        return result !== "unavailable";
      }

      return currentState.type === "available";
    };

    await doLoad(peers);

    // Retry loading from peers that have the retry flag enabled
    const peersWithRetry = peers.filter((p) => p.retryUnavailableCoValues);

    if (peersWithRetry.length > 0) {
      // We want to exit early if the coValue becomes available in between the retries
      await Promise.race([
        runWithRetry(
          () => doLoad(peersWithRetry),
          CO_VALUE_LOADING_MAX_RETRIES,
        ),
        this.value,
      ]);
    }

    // If after the retries the coValue is still loading, we consider the load failed
    if (this.state.type === "loading") {
      this.dispatch({
        type: "load-failed",
      });
    }
  }

  dispatch(action: CoValueStateAction) {
    const prevState = this.state;

    switch (action.type) {
      case "load-requested":
        // We use this action to reset the loading state
        if (prevState.type === "loading" || prevState.type === "unknown") {
          this.state = new CoValueLoadingState(action.peersIds);
        }

        break;
      case "load-failed":
        if (prevState.type === "loading") {
          this.state = new CoValueUnavailableState();
          this.resolve("unavailable");
        }

        break;
      case "found-in-peer":
        if (prevState.type === "loading") {
          // When the coValue is found we move in the available state
          this.state = new CoValueAvailableState(action.coValue);
          prevState.update(action.peerId, action.coValue);
          this.resolve(action.coValue);
        }

        break;
      case "not-found-in-peer":
        if (prevState.type === "loading") {
          prevState.update(action.peerId, "unavailable");
        }

        break;
    }

    return this.state;
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
