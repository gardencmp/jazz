import { AgentSecret, LocalNode, Peer, WasmCrypto } from "cojson";
import { createWebSocketPeer } from "cojson-transport-ws";
import {
  Account,
  AccountClass,
  ID,
  createJazzContext,
  fixedCredentialsAuth,
  randomSessionProvider,
} from "jazz-tools";
import { WebSocket } from "ws";

/** @category Context Creation */
export async function startWorker<Acc extends Account>({
  accountID = process.env.JAZZ_WORKER_ACCOUNT,
  accountSecret = process.env.JAZZ_WORKER_SECRET,
  syncServer = "wss://cloud.jazz.tools",
  AccountSchema = Account as unknown as AccountClass<Acc>,
}: {
  accountID?: string;
  accountSecret?: string;
  syncServer?: string;
  AccountSchema?: AccountClass<Acc>;
}): Promise<{ worker: Acc; done: () => void }> {
  let node: LocalNode | undefined = undefined;
  const wsPeer = webSocketWithReconnection(syncServer, (peer) => {
    node?.syncManager.addPeer(peer);
  });

  if (!accountID) {
    throw new Error("No accountID provided");
  }
  if (!accountSecret) {
    throw new Error("No accountSecret provided");
  }
  if (!accountID.startsWith("co_")) {
    throw new Error("Invalid accountID");
  }
  if (!accountSecret?.startsWith("sealerSecret_")) {
    throw new Error("Invalid accountSecret");
  }

  const context = await createJazzContext({
    auth: fixedCredentialsAuth({
      accountID: accountID as ID<Acc>,
      secret: accountSecret as AgentSecret,
    }),
    AccountSchema,
    // TODO: locked sessions similar to browser
    sessionProvider: randomSessionProvider,
    peersToLoadFrom: [wsPeer.peer],
    crypto: await WasmCrypto.create(),
  });

  node = context.account._raw.core.node;

  async function done() {
    wsPeer.done();
    context.done();
  }

  return { worker: context.account as Acc, done };
}

function webSocketWithReconnection(
  peer: string,
  addPeer: (peer: Peer) => void,
) {
  let done = false;
  const wsPeer = createWebSocketPeer({
    websocket: new WebSocket(peer),
    id: "upstream",
    role: "server",
    onClose: handleClose,
  });

  let timer: ReturnType<typeof setTimeout>;
  function handleClose() {
    if (done) return;

    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(new Date(), "Reconnecting to upstream " + peer);

      const wsPeer: Peer = createWebSocketPeer({
        id: "upstream",
        websocket: new WebSocket(peer),
        role: "server",
        onClose: handleClose,
      });

      addPeer(wsPeer);
    }, 1000);
  }

  return {
    peer: wsPeer,
    done: () => {
      done = true;
      clearTimeout(timer);
    },
  };
}
