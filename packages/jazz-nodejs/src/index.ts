import {
    websocketReadableStream,
    websocketWritableStream,
} from "cojson-transport-nodejs-ws";
import { WebSocket } from "ws";
import "dotenv/config";

import { webcrypto } from "node:crypto";
import { AccountID, AgentSecret, ControlledAccount, LocalNode, Peer, SessionID, cojsonReady } from "cojson";
import { newRandomSessionID } from "cojson/src/coValueCore";
if (!("crypto" in globalThis))  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

import { writeFile } from "node:fs/promises"

export async function createOrResumeWorker(workerName: string, syncServer = "wss://sync.jazz.tools") {
    await cojsonReady;

    const existingID = process.env.JAZZ_WORKER_ID;
    const existingSecret = process.env.JAZZ_WORKER_SECRET;

    let localNode: LocalNode;

    const ws = new WebSocket(syncServer);

    const wsPeer: Peer = {
        id: "globalMesh",
        role: "server",
        incoming: websocketReadableStream(ws),
        outgoing: websocketWritableStream(ws),
    };

    if (existingID && existingSecret) {
        // TODO: locked sessions similar to browser
        const sessionID = process.env.JAZZ_WORKER_SESSION || newRandomSessionID(existingID as AccountID);

        console.log("Loading worker", existingID);

        localNode = await LocalNode.withLoadedAccount({
            accountID: existingID as AccountID,
            accountSecret: existingSecret as AgentSecret,
            sessionID: sessionID as SessionID,
            peersToLoadFrom: [wsPeer]
        });

        console.log("Resuming worker", existingID, localNode.expectProfileLoaded(localNode.account.id as AccountID).get("name"));
    } else {
        const newWorker = await LocalNode.withNewlyCreatedAccount({
            name: workerName,
        });

        localNode = newWorker.node;

        localNode.syncManager.addPeer(wsPeer);

        await writeFile(".env", `JAZZ_WORKER_ID=${newWorker.accountID}\nJAZZ_WORKER_SECRET=${newWorker.accountSecret}\n`);

        console.log("Created worker", newWorker.accountID, workerName);
        console.log("!!! Make sure to exclude .env from git, as it now contains your worker's credentials !!!")
    }

    return { localNode, worker: localNode.account as ControlledAccount };
}

export { autoSub } from "jazz-autosub";