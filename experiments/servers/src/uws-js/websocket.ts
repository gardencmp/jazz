import uWS from "uWebSockets.js";
import path from "path";
import fs from "fs";
import { lookup } from "mime-types";
import {
    CoValue,
    uWebSocketResponse,
    MutationEvent,
    covalues,
    events,
    addCoValue,
    updateCoValue,
    updateCoValueBinary,
    PORT,
} from "../util";
import logger from "../util/logger";
import { tlsCertPath } from "../util/tls";
import { FileStreamManager } from "../node-js/filestream-manager";

// Serve up the client folder on page load
const rootDir = path.resolve(__dirname, "../..");
const staticDir =
    process.env.NODE_ENV === "production"
        ? path.join(rootDir, "dist", "public")
        : path.join(rootDir, "public");

const fileManager = new FileStreamManager();

const app = uWS.SSLApp({
    key_file_name: tlsCertPath.tlsKeyName,
    cert_file_name: tlsCertPath.tlsCertName
}).any("/*", (res, req) => {

    const url = req.getUrl();
    const prefix = "/faker";

    try {
        if (url === "/") {
            const filePath = path.join(staticDir, "client", "ws", "index.html");
            const fileContents = fs.readFileSync(filePath);
            
            res.writeHeader('Content-Type', 'text/html')
            .end(fileContents);
            
        } else if (url.startsWith(prefix)) {
            const file = url.substring(prefix.length, url.length);
            const filePath = path.join(
                __dirname,
                `../../node_modules/@faker-js/faker/dist/esm/${file}`,
            );

            const fileContents = fs.readFileSync(filePath);
            const fileStat = fs.statSync(filePath);
            
            res.writeHeader("Content-Length", `${fileStat.size}`);
            res.writeHeader("Content-Type", lookup(filePath) || "application/octet-stream");
            res.end(fileContents);
            
        } else {
            res.writeStatus('404').end('Not found');
        }
    } catch (err) {
        logger.error(err);
        res.writeStatus('404').end('File not found');
    }

}).ws("/*", {
    /* Options */
    compression: uWS.DISABLED, /* uWS.SHARED_COMPRESSOR, */
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 10,
    /* maxBackpressure: 1024, */

    open: (ws: uWS.WebSocket<{}>) => {
        logger.debug("[Event-Open] New WebSocket connection");

        // FIXME: broadcasts will only work if registered here
        ws.subscribe("9cab6ad3-eefd-4a19-95a3-f0f0d86e1e32");
    },

    message: (ws: uWS.WebSocket<{}>, message: ArrayBuffer, isBinary: boolean) => {
        try {
            const messageStr = Buffer.from(message).toString();
            const data = JSON.parse(messageStr);
            const { action, binary, payload } = data;
            const res = new uWebSocketResponse(ws, payload?.uuid);

            switch (action) {
                case "LIST":
                    res.action("LIST");
                    if (payload && payload === "all") {
                        res.status(200).json(Object.values(covalues));
                    } else {
                        res.status(200).json(Object.keys(covalues));
                    }
                    break;

                case "GET":
                    res.action("GET");
                    const covalue: CoValue = covalues[payload.uuid];
                    if (covalue) {
                        if (binary) {
                            const filePath = covalue.url?.path as string;
                            if (!filePath) {
                                res.status(404).json({
                                    m: "CoValue binary file not found",
                                });
                                return;
                            }

                            fileManager.chunkFileDownload(
                                {
                                    filePath,
                                    range: payload.range,
                                },
                                {
                                    type: "websocket",
                                    wsr: res,
                                },
                            );
                        } else {
                            // send textual CoValue
                            res.status(200).json(covalue);
                        }
                    } else {
                        res.status(404).json({ m: "CoValue not found" });
                    }
                    break;

                case "POST":
                    res.action("POST");
                    if (payload) {
                        if (binary) {
                            fileManager.chunkFileUpload(payload, res);
                        } else {
                            addCoValue(covalues, payload);
                            res.status(201).json({ m: "OK" });
                        }
                    } else {
                        res.status(400).json({ m: "CoValue cannot be blank" });
                    }
                    break;

                case "PATCH":
                    res.action("PATCH");
                    const { uuid, ...partialCovalue } = payload;
                    const existingCovalue = covalues[uuid];

                    if (existingCovalue) {
                        if (binary) {
                            updateCoValueBinary(
                                existingCovalue,
                                partialCovalue,
                            );
                        } else {
                            updateCoValue(existingCovalue, partialCovalue);
                        }
                        res.status(204).json({ m: "OK" });

                        // broadcast the mutation to clients
                        const event = events.get(uuid) as MutationEvent;
                        const { type } = event;
                        logger.debug(
                            `[Broadcast] Mutation event of type: '${type}' was found for: ${uuid}.`,
                        );
                        // res.broadcast(event);
                        res.status(200).action("MUTATION").broadcast(event);
                    } else {
                        res.status(404).json({ m: "CoValue not found" });
                    }
                    break;

                case "SUBSCRIBE":
                    res.action("SUBSCRIBE");
                    const subscriptionUuid = payload.uuid;
                    const ua =
                        payload.ua && payload.ua.length == 2
                            ? payload.ua
                            : `0${payload.ua}`;
                    logger.debug(
                        `[Client-#${ua}] Opening a subscription on: ${subscriptionUuid}.`,
                    );

                    // Subscribe to events for this UUID
                    ws.subscribe(subscriptionUuid);

                    res.status(200).json({ m: "OK" });
                    break;

                default:
                    res.status(400)
                        .action("ERROR")
                        .json({ m: "Unknown action" });
            }
        } catch (error) {
            logger.error("Error processing WebSocket message:", error);
            new uWebSocketResponse(ws, "")
                .status(500)
                .action("ERROR")
                .json({ m: "Error processing request" });
        }
    },

    drain: (ws: uWS.WebSocket<{}>) => {
        logger.debug(`[Event-Drain] WebSocket backpressure: ${ws.getBufferedAmount()}`);
    },

    close: (ws: uWS.WebSocket<{}>, code: number, message: ArrayBuffer) => {
        logger.debug('[Event-Close] WebSocket closed');
        // ws.getUserData();
    },

    dropped: (ws: uWS.WebSocket<{}>, message: ArrayBuffer, isBinary: boolean) => {
        logger.debug(`[Event-Dropped] WebSocket message dropped => isBinary: ${isBinary}, messageLength: ${message.byteLength}`);
    },
});

app.listen(+PORT, (token) => {
    if (token) {
        logger.info(
            `HTTP/1.1 + TLSv1.3 Server is running on: https://localhost:${PORT}`,
        );
        logger.info(
            `WebSocket Server is running on: wss://localhost:${PORT}`,
        );
    } else {
        logger.error(`Failed to start server on port: ${PORT}`);
    }
});

    