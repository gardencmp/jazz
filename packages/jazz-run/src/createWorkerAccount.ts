import { createWebSocketPeer } from "cojson-transport-ws";
import { Account, WasmCrypto, isControlledAccount } from "jazz-tools";
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

  await account.waitForAllCoValuesSync({ timeout: 4_000 });

  return {
    accountId: account.id,
    agentSecret: account._raw.agentSecret,
  };
};
