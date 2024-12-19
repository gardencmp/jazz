import { CoValueCore, Profile, emptyKnownState } from "cojson";
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
    syncManager.syncCoValue(accountCoValue, emptyKnownState(accountCoValue.id)),
    syncManager.syncCoValue(
      accountProfileCoValue,
      emptyKnownState(accountProfileCoValue.id),
    ),
  ]);

  await Promise.race([
    Promise.all([
      syncManager.waitForUploadIntoPeer(peer.id, accountCoValue.id),
      syncManager.waitForUploadIntoPeer(peer.id, accountProfileCoValue.id),
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
    failAfter(10_000, "Timeout: Account loading check failed"),
  ]);

  return {
    accountId: account.id,
    agentSecret: account._raw.agentSecret,
  };
};

function failAfter(ms: number, errorMessage: string) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
}
