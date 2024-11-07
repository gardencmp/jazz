import { CoValueCore, Profile } from "cojson";
import { createWebSocketPeer } from "cojson-transport-ws";
import {
  Account,
  CoMap,
  Peer,
  WasmCrypto,
  createJazzContext,
  isControlledAccount,
} from "jazz-tools";
import { fixedCredentialsAuth, randomSessionProvider } from "jazz-tools";
import { WebSocket } from "ws";

export const createWorkerAccount = async ({
  name,
  peer: peerAddr,
}: {
  name: string;
  peer: string;
}) => {
  const crypto = await WasmCrypto.create();

  const peer = createWebSocketPeer({
    id: "upstream",
    websocket: new WebSocket(peerAddr),
    role: "server",
  });

  const account = await Account.create({
    creationProps: { name },
    peersToLoadFrom: [peer],
    crypto,
  });

  if (!isControlledAccount(account)) {
    throw new Error("account is not a controlled account");
  }

  const accountCoValue = account._raw.core;
  const accountProfileCoValue = account.profile!._raw.core;
  const syncManager = account._raw.core.node.syncManager;

  await Promise.all([
    syncManager.syncCoValue(accountCoValue),
    syncManager.syncCoValue(accountProfileCoValue),
  ]);

  await Promise.race([
    Promise.all([
      waitForSync(account, peer, accountCoValue),
      waitForSync(account, peer, accountProfileCoValue),
    ]),
    failAfter(
      4_000,
      "Timeout: Didn't manage to upload the account and profile",
    ),
  ]);

  // Spawn a second peer to double check that the account is fully synced
  const peer2 = createWebSocketPeer({
    id: "verifyingPeer",
    websocket: new WebSocket(peerAddr),
    role: "server",
  });

  await Promise.race([
    createJazzContext({
      auth: fixedCredentialsAuth({
        accountID: account.id,
        secret: account._raw.agentSecret,
      }),
      sessionProvider: randomSessionProvider,
      peersToLoadFrom: [peer2],
      crypto,
    }),
    failAfter(4_000, "Timeout: Account loading check failed"),
  ]);

  return {
    accountId: account.id,
    agentSecret: account._raw.agentSecret,
  };
};

function waitForSync(account: Account, peer: Peer, coValue: CoValueCore) {
  const syncManager = account._raw.core.node.syncManager;
  const peerState = syncManager.peers[peer.id];

  if (!peerState) {
    throw new Error(`Peer state for ${peer.id} not found`);
  }

  const isSynced = () => {
    const knownState = coValue.knownState();

    if (!peerState.optimisticKnownStates.get(coValue.id)) {
      return false;
    }

    return isEqualSession(
      knownState.sessions,
      peerState.optimisticKnownStates.get(coValue.id)?.sessions ?? {},
    );
  };

  if (isSynced()) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const unsubscribe = peerState?.optimisticKnownStates.subscribe(
      (id, knownState) => {
        if (id !== coValue.id) return;

        if (isSynced()) {
          resolve(true);
          unsubscribe?.();
        }
      },
    );
  });
}

function isEqualSession(a: Record<string, number>, b: Record<string, number>) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const sessionId of keysA) {
    if (a[sessionId] !== b[sessionId]) {
      return false;
    }
  }

  return true;
}

function failAfter(ms: number, errorMessage: string) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
}
