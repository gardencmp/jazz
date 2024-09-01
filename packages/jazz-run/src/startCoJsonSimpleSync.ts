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

const port = Options.text("port")
    .pipe(Options.withAlias("p"))
    .pipe(Options.withDefault("4200"));

export const startCoJsonSimpleSync = Command.make(
    "cojson-simple-sync",
    { port },
    ({ port }) => {
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

            wss.on("connection", function connection(ws, req) {
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

            // Indefintely pending promise to keep the server up
            yield* Effect.promise(() => new Promise(() => {}));
        });
    },
);
