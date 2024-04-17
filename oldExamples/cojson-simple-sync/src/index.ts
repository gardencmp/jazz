import { ControlledAgent, LocalNode, cojsonInternals, cojsonReady } from "cojson";
import { WebSocketServer } from "ws";
import { SQLiteStorage } from "cojson-storage-sqlite";
import { websocketReadableStream, websocketWritableStream } from "./websocketStreams.js";

const wss = new WebSocketServer({ port: 4200 });

console.log("COJSON sync server listening on port " + wss.options.port);

await cojsonReady;
import { webcrypto } from 'node:crypto'
(globalThis as any).crypto = webcrypto

const agentSecret = cojsonInternals.newRandomAgentSecret();
const agentID = cojsonInternals.getAgentID(agentSecret);

const localNode = new LocalNode(
    new ControlledAgent(agentSecret),
    cojsonInternals.newRandomSessionID(agentID)
);

SQLiteStorage.asPeer({ filename: "./sync.db" })
    .then((storage) => localNode.syncManager.addPeer(storage))
    .catch((e) => console.error(e));

wss.on("connection", function connection(ws, req) {
    const pinging = setInterval(() => {
        ws.send(
            JSON.stringify({
                type: "ping",
                time: Date.now(),
                dc: "cojson-simple-sync",
            })
        );
    }, 2000);

    ws.on("close", () => {
        clearInterval(pinging);
    });

    const clientAddress =
        (req.headers["x-forwarded-for"] as string | undefined)
            ?.split(",")[0]
            ?.trim() || req.socket.remoteAddress;

    const clientId = clientAddress + "@" + new Date().toISOString() + Math.random().toString(36).slice(2);

    localNode.syncManager.addPeer({
        id: clientId,
        role: "client",
        incoming: websocketReadableStream(ws),
        outgoing: websocketWritableStream(ws),
    });

    ws.on("error", (e) => console.error(`Error on connection ${clientId}:`, e));
});
