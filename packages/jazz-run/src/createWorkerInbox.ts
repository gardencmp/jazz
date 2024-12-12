import { createWebSocketPeer } from "cojson-transport-ws";
import { Account, Inbox, WasmCrypto, isControlledAccount } from "jazz-tools";
import { WebSocket } from "ws";

export const createWorkerInbox = async ({
  peer: peerAddr,
}: {
  peer: string;
}) => {
  const crypto = await WasmCrypto.create();

  const peer = createWebSocketPeer({
    id: "upstream",
    websocket: new WebSocket(peerAddr),
    role: "server",
  });

  const account = await Account.create({
    creationProps: { name: "Inbox Creator" },
    peersToLoadFrom: [peer],
    crypto,
  });

  if (!isControlledAccount(account)) {
    throw new Error("account is not a controlled account");
  }

  const inbox = Inbox.create(account);
  const { inboxWriteOnlyTicket, inboxAdminTicket } =
    await inbox.createTickets();

  await account.waitForAllCoValuesSync({ timeout: 4_000 });

  return {
    inboxWriteOnlyTicket,
    inboxAdminTicket,
  };
};
