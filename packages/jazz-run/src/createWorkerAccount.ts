import { createWebSocketPeer } from "cojson-transport-ws";
import { Account, Inbox, WasmCrypto, isControlledAccount } from "jazz-tools";
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

  // Create the inbox for the worker account
  Inbox.createIfMissing(account);

  await account.waitForAllCoValuesSync({ timeout: 4_000 });

  return {
    accountID: account.id,
    agentSecret: account._raw.agentSecret,
  };
};
