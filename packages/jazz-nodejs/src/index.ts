import { AgentSecret, Peer, WasmCrypto } from "cojson";
import { createWebSocketPeer } from "cojson-transport-ws";
import { Account, createJazzContext, ID } from "jazz-tools";
import {
    AccountClass,
    fixedCredentialsAuth,
    randomSessionProvider,
} from "jazz-tools/src/internal";
import { WebSocket } from "ws";

/** @category Context Creation */
export async function startWorker<Acc extends Account>({
    accountID = process.env.JAZZ_WORKER_ACCOUNT,
    accountSecret = process.env.JAZZ_WORKER_SECRET,
    syncServer: peer = "wss://sync.jazz.tools",
    AccountSchema = Account as unknown as AccountClass<Acc>,
}: {
    accountID?: string;
    accountSecret?: string;
    syncServer?: string;
    AccountSchema?: AccountClass<Acc>;
}): Promise<{ worker: Acc; done: () => void }> {
    const wsPeer: Peer = createWebSocketPeer({
        id: "upstream",
        websocket: new WebSocket(peer),
        role: "server",
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

    const { account: worker, done } = await createJazzContext({
        auth: fixedCredentialsAuth({
            accountID: accountID as ID<Acc>,
            secret: accountSecret as AgentSecret,
        }),
        AccountSchema,
        // TODO: locked sessions similar to browser
        sessionProvider: randomSessionProvider,
        peersToLoadFrom: [wsPeer],
        crypto: await WasmCrypto.create(),
    });

    setInterval(async () => {
        if (!worker._raw.core.node.syncManager.peers["upstream"]) {
            console.log(new Date(), "Reconnecting to upstream " + peer);

            const wsPeer: Peer = createWebSocketPeer({
                id: "upstream",
                websocket: new WebSocket(peer),
                role: "server",
            });

            worker._raw.core.node.syncManager.addPeer(wsPeer);
        }
    }, 5000);

    return { worker: worker as Acc, done };
}
