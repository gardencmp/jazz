import {
    websocketReadableStream,
    websocketWritableStream,
} from "cojson-transport-nodejs-ws";
import { WebSocket } from "ws";

import { AgentSecret, Peer, SessionID, WasmCrypto } from "cojson";
import { Account, CoValueClass, ID } from "jazz-tools";

/** @category Context Creation */
export async function startWorker<Acc extends Account>({
    accountID = process.env.JAZZ_WORKER_ACCOUNT,
    accountSecret = process.env.JAZZ_WORKER_SECRET,
    sessionID = process.env.JAZZ_WORKER_SESSION,
    syncServer: peer = "wss://sync.jazz.tools",
    accountSchema = Account as unknown as CoValueClass<Acc> & typeof Account,
}: {
    accountID?: string;
    accountSecret?: string;
    sessionID?: string;
    syncServer?: string;
    accountSchema?: CoValueClass<Acc> & typeof Account;
}): Promise<{ worker: Acc }> {
    const ws = new WebSocket(peer);

    const wsPeer: Peer = {
        id: "upstream",
        role: "server",
        incoming: websocketReadableStream(ws),
        outgoing: websocketWritableStream(ws),
    };

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

    const worker = await accountSchema.become({
        accountID: accountID as ID<Acc>,
        accountSecret: accountSecret as AgentSecret,
        // TODO: locked sessions similar to browser
        sessionID: sessionID as SessionID | undefined,
        peersToLoadFrom: [wsPeer],
        crypto: await WasmCrypto.create(),
    });

    setInterval(() => {
        if (!worker._raw.core.node.syncManager.peers["upstream"]) {
            console.log(new Date(), "Reconnecting to upstream " + peer);
            const ws = new WebSocket(peer);

            const wsPeer: Peer = {
                id: "upstream",
                role: "server",
                incoming: websocketReadableStream(ws),
                outgoing: websocketWritableStream(ws),
            };

            worker._raw.core.node.syncManager.addPeer(wsPeer);
        }
    }, 5000);

    return { worker: worker as Acc };
}
