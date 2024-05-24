import {
    websocketReadableStream,
    websocketWritableStream,
} from "cojson-transport-nodejs-ws";
import { WebSocket } from "ws";

import {
    AccountID,
    AgentSecret,
    Peer,
    SessionID,
    WasmCrypto,
    cojsonInternals,
} from "cojson";
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

    // TODO: locked sessions similar to browser
    const sessionIDToUse =
        sessionID || cojsonInternals.newRandomSessionID(accountID as AccountID);

    if (!accountID) {
        throw new Error("No accountID provided");
    }
    if (!accountSecret) {
        throw new Error("No accountSecret provided");
    }
    if (!sessionIDToUse) {
        throw new Error("No sessionID provided");
    }
    if (!accountID.startsWith("co_")) {
        throw new Error("Invalid accountID");
    }
    if (!accountSecret?.startsWith("sealerSecret_")) {
        throw new Error("Invalid accountSecret");
    }
    if (
        !sessionIDToUse.startsWith("co_") ||
        !sessionIDToUse.includes("_session")
    ) {
        throw new Error("Invalid sessionID");
    }

    const worker = await accountSchema.become({
        accountID: accountID as ID<Acc>,
        accountSecret: accountSecret as AgentSecret,
        sessionID: sessionIDToUse as SessionID,
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
