import uWS from "uWebSockets.js";
import path from "path";
import fs from "fs";
import { lookup } from "mime-types";
import {
    CoValue,
    uWebSocketResponse,
    MutationEvent,
    covalues,
    firstCoValue,
    events,
    addCoValue,
    updateCoValue,
    updateCoValueBinary,
    parseUUIDAndUAFromCookie,
    formatClientNumber,
    BenchmarkStore,
    shutdown,
    uWebSocketResponseWrapper,
    PORT,
} from "../util";
import logger from "../util/logger";
import { tlsCertPath } from "../util/tls";
import { FileStreamManager } from "../node-js/filestream-manager";

interface UserData {
    uuid?: string;
    ua?: string;
}

// Serve up the client folder on page load
const rootDir = path.resolve(__dirname, "../..");
const staticDir =
    process.env.NODE_ENV === "production"
        ? path.join(rootDir, "dist", "public")
        : path.join(rootDir, "public");

const fileManager = new FileStreamManager();
const benchmarkStore = new BenchmarkStore();

const app = uWS.SSLApp({
    key_file_name: tlsCertPath.tlsKeyName,
    cert_file_name: tlsCertPath.tlsCertName
}).any("/*", (res: uWS.HttpResponse, req: uWS.HttpRequest) => {

    const query = req.getQuery();
    const params = query?.split('&') || [];

    if (params.length === 3 && params[0].startsWith("uuid") && params[2].startsWith("ua")) {
        const uuid = params[0].substring("uuid".length + 1);
        const ua = params[2].substring("ua".length + 1);
        res.writeHeader('Set-Cookie', `uuid=${uuid}; Path=/; HttpOnly; Secure; SameSite=Strict`)
            .writeHeader('Set-Cookie', `ua=${ua}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    } else {
        // Remove the cookies, if no pertinent params are present
        res.writeHeader('Set-Cookie', `uuid=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Strict`)
            .writeHeader('Set-Cookie', `ua=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Strict`);
    }

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
        } else if (url.startsWith("/stop")) {
            shutdown(new uWebSocketResponseWrapper(res), benchmarkStore);

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

    // Upgrade handler - called prior to establishing a WebSocket connection
    upgrade: (res, req, context) => {
        const userData: UserData = parseUUIDAndUAFromCookie(req);

        // Complete the WebSocket upgrade and pass along the UUID
        res.upgrade(
            userData,
            req.getHeader('sec-websocket-key'),
            req.getHeader('sec-websocket-protocol'),
            req.getHeader('sec-websocket-extensions'),
            context
        );
    },

    open: (ws: uWS.WebSocket<{}>) => {
        const userData: UserData = ws.getUserData();
        const clientNum = formatClientNumber(userData);
        logger.debug(`[Event-Open] [Client-#${clientNum}] New WebSocket connection`);

        if (userData && userData?.uuid && userData?.ua) {
            ws.subscribe(userData?.uuid);
            logger.debug(`[Event-Open] [Client-#${clientNum}] Subscribing to mutation events on: ${userData?.uuid}`);
        } else {
            ws.subscribe(firstCoValue.uuid);
            logger.debug(`[Event-Open] [Client-#${clientNum}] Subscribing to mutation events on (1st CoValue): ${firstCoValue.uuid}`);
        }
    },

    message: (ws: uWS.WebSocket<{}>, message: ArrayBuffer, isBinary: boolean) => {
        let res;
        try {
            const messageStr = Buffer.from(message).toString();
            const data = JSON.parse(messageStr);
            const { action, binary, payload } = data;
            res = new uWebSocketResponse(ws, payload?.uuid, benchmarkStore.requestId());

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
                    res.action("GET").path(`/covalue/${payload.uuid}`);
                    const covalue: CoValue = covalues[payload.uuid];
                    if (covalue) {
                        if (binary) {
                            res.path(`/covalue/${payload.uuid}/binary`);
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
                    res.action("POST").path(`/covalue`);
                    if (payload) {
                        if (binary) {
                            res.path(`/covalue/binary`);
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
                    res.action("PATCH").path(`/covalue/${payload.uuid}`);
                    const { uuid, ...partialCovalue } = payload;
                    const existingCovalue = covalues[uuid];

                    if (existingCovalue) {
                        if (binary) {
                            res.path(`/covalue/${uuid}/binary`);
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
                        res.status(200).action("MUTATION").broadcast(event);
                    } else {
                        res.status(404).json({ m: "CoValue not found" });
                    }
                    break;

                case "SUBSCRIBE":
                    res.action("SUBSCRIBE");
                    const subscriptionUuid = payload.uuid;
                    const ua = formatClientNumber(payload);
                    logger.debug(
                        `[Client-#${ua}] Subscribed to mutation events on: ${subscriptionUuid}.`,
                    );

                    // Subscribe to events for this UUID
                    // ws.subscribe(subscriptionUuid);
                    // ws.subscribe() is a no-op here (i.e. inside `message:` handler). Only works in `open:` handler

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
        } finally {
            if (res) {
                const log = res.requestLog();
                log.method = log.method === "MUTATION" ? "PATCH" : log.method; // change it back for consistency
                if (log.method && ["GET", "POST", "PATCH"].includes(log.method)) benchmarkStore.addRequestLog(log);
            }
        }
    },

    drain: (ws: uWS.WebSocket<{}>) => {
        logger.debug(`[Event-Drain] WebSocket backpressure: ${ws.getBufferedAmount()}`);
    },

    close: (ws: uWS.WebSocket<{}>, code: number, message: ArrayBuffer) => {
        const userData: UserData = ws.getUserData();
        const clientNum = formatClientNumber(userData);
        logger.debug(`[Event-Close] [Client-#${clientNum}] WebSocket closed`);
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

    