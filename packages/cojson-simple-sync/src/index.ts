import { AnonymousControlledAccount, LocalNode, cojsonInternals } from "cojson";
import { WebSocketServer, createWebSocketStream } from "ws";
import { Duplex } from "node:stream";
import { TransformStream } from "node:stream/web";
import { SQLiteStorage } from "cojson-storage-sqlite";

const wss = new WebSocketServer({ port: 4200 });

console.log("COJSON sync server listening on port " + wss.options.port);

const agentSecret = cojsonInternals.newRandomAgentSecret();
const agentID = cojsonInternals.getAgentID(agentSecret);

const localNode = new LocalNode(
    new AnonymousControlledAccount(agentSecret),
    cojsonInternals.newRandomSessionID(agentID)
);

SQLiteStorage.asPeer({ filename: "./sync.db" })
    .then((storage) => localNode.sync.addPeer(storage))
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

    const duplexStream = createWebSocketStream(ws, {
        decodeStrings: false,
        readableObjectMode: true,
        writableObjectMode: true,
        encoding: "utf-8",
        defaultEncoding: "utf-8",
    });

    const { readable: incomingStrings, writable: outgoingStrings } =
        Duplex.toWeb(duplexStream);

    const toJSON = new TransformStream({
        transform: (chunk, controller) => {
            controller.enqueue(JSON.parse(chunk));
        },
    });

    const fromJSON = new TransformStream({
        transform: (chunk, controller) => {
            controller.enqueue(JSON.stringify(chunk));
        },
    });

    const clientAddress =
        (req.headers["x-forwarded-for"] as string | undefined)
            ?.split(",")[0]
            ?.trim() || req.socket.remoteAddress;

    const clientId = clientAddress + "@" + new Date().toISOString();

    localNode.sync.addPeer({
        id: clientId,
        role: "client",
        incoming: incomingStrings.pipeThrough(toJSON),
        outgoing: fromJSON.writable,
    });

    void fromJSON.readable.pipeTo(outgoingStrings);

    ws.on("error", (e) => console.error(`Error on connection ${clientId}:`, e));
});
