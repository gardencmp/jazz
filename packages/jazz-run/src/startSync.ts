import { Command, Options } from "@effect/cli";
import {
    ControlledAgent,
    LocalNode,
    WasmCrypto,
    cojsonInternals,
} from "cojson";
import { WebSocketServer } from "ws";

import { createWebSocketPeer } from "cojson-transport-ws";
import { Effect } from "effect";
import { SQLiteStorage } from "cojson-storage-sqlite";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";

const port = Options.text("port")
    .pipe(Options.withAlias("p"))
    .pipe(
        Options.withDescription(
            "Select a different port for the WebSocket server. Default is 4200",
        ),
    )
    .pipe(Options.withDefault("4200"));

const inMemory = Options.boolean("in-memory").pipe(
    Options.withDescription("Use an in-memory storage instead of file-based"),
);

const db = Options.file("db")
    .pipe(
        Options.withDescription(
            "The path to the file where to store the data. Default is 'sync-db/storage.db'",
        ),
    )
    .pipe(Options.withDefault("sync-db/storage.db"));

export const startSync = Command.make(
    "sync",
    { port, inMemory, db },
    ({ port, inMemory, db }) => {
        return Effect.gen(function* () {
            const crypto = yield* Effect.promise(() => WasmCrypto.create());

            const wss = new WebSocketServer({ port: parseInt(port) });

            console.log(
                "COJSON sync server listening on port " + wss.options.port,
            );

            const agentSecret = crypto.newRandomAgentSecret();
            const agentID = crypto.getAgentID(agentSecret);

            const localNode = new LocalNode(
                new ControlledAgent(agentSecret, crypto),
                cojsonInternals.newRandomSessionID(agentID),
                crypto,
            );

            if (!inMemory) {
                yield* Effect.promise(() =>
                    mkdir(dirname(db), { recursive: true }),
                );

                const storage = yield* Effect.promise(() =>
                    SQLiteStorage.asPeer({ filename: db }),
                );

                localNode.syncManager.addPeer(storage);
            }

            wss.on("connection", function connection(ws, req) {
                // ping/pong for the connection liveness
                const pinging = setInterval(() => {
                    ws.send(
                        JSON.stringify({
                            type: "ping",
                            time: Date.now(),
                            dc: "unknown",
                        }),
                    );
                }, 1500);

                ws.on("close", () => {
                    clearInterval(pinging);
                });

                const clientAddress =
                    (req.headers["x-forwarded-for"] as string | undefined)
                        ?.split(",")[0]
                        ?.trim() || req.socket.remoteAddress;

                const clientId = clientAddress + "@" + new Date().toISOString();

                localNode.syncManager.addPeer(
                    createWebSocketPeer({
                        id: clientId,
                        role: "client",
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        websocket: ws as any, // TODO: fix types
                        expectPings: false,
                    }),
                );

                ws.on("error", (e) =>
                    console.error(`Error on connection ${clientId}:`, e),
                );
            });

            // Keep the server up
            yield* Effect.never;
        });
    },
);
