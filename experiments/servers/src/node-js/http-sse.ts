import express, { Request, Response, NextFunction } from "express";
import https from "https";
import http from "http";
import spdy from "spdy";
import path from "path";
import bodyParser from "body-parser";
import {
    CoValue,
    MutationEvent,
    covalues,
    events,
    addCoValue,
    updateCoValue,
    updateCoValueBinary,
    PORT,
    PerformanceStore,
    PerformanceEntry,
    PerformanceTimer,
} from "../util";
import logger from "../util/logger";
import { tlsCert } from "../util/tls";
import { FileStreamManager, UploadBody } from "./filestream-manager";

const app = express();
const fileManager = new FileStreamManager();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static("public/client/http"));
// Allow testing from plain HTTP/1.1 (without SSL)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3001'); // Allow requests from http://localhost:3001
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true'); // Allow cookies
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const performanceStore = new PerformanceStore();
app.use((req: Request, res: Response, next: NextFunction): void => {
    if ((req.method === 'GET' && req.path.startsWith("/covalue/")) || req.method === 'POST' || req.method === 'PATCH') {
        const timer = new PerformanceTimer(performanceStore.requestId());

        res.on('finish', () => {
            timer.method(req.method).path(req.path).status(res.statusCode).end();
            performanceStore.addEntry(timer.toEntry());
            logger.debug(`Performance entry: ${JSON.stringify(timer.toEntry())}`);
        });
    }

    next();
});

app.use(
    "/faker",
    express.static(
        path.join(__dirname, "../../node_modules/@faker-js/faker/dist/esm"),
    ),
);

app.get("/covalue", (req: Request, res: Response) => {
    const all = req.query.all as string;

    if (all) {
        res.json(Object.values(covalues));
    } else {
        res.json(Object.keys(covalues));
    }
});

app.get("/covalue/:uuid", (req: Request, res: Response) => {
    const { uuid } = req.params;

    const covalue = covalues[uuid];
    if (!covalue) {
        return res.status(404).json({ m: "CoValue not found" });
    }

    res.json(covalue);
});

app.get("/covalue/:uuid/binary", async (req: Request, res: Response) => {
    const { uuid } = req.params;

    const covalue: CoValue = covalues[uuid];
    if (!covalue) {
        return res.status(404).json({ m: "CoValue not found" });
    }

    const filePath = covalue.url?.path as string;
    if (!filePath) {
        return res.status(404).json({ m: "CoValue binary file not found" });
    }

    await fileManager.chunkFileDownload(
        {
            filePath,
            range: req.headers.range,
        },
        {
            type: "http",
            res,
        },
    );
});

app.post("/covalue", (req: Request, res: Response) => {
    const covalue = req.body;

    if (!covalue) {
        return res.status(400).json({ m: "CoValue cannot be blank" });
    }

    addCoValue(covalues, covalue);
    res.status(201).json({ m: "OK" });
});

app.post("/covalue/binary", async (req: Request, res: Response) => {
    const payload = req.body as UploadBody;
    await fileManager.chunkFileUpload(payload, res);
});

app.patch("/covalue/:uuid", (req: Request, res: Response) => {
    const { uuid } = req.params;
    const partialCovalue = req.body as Partial<CoValue>;

    const covalue = covalues[uuid];
    if (!covalue) {
        return res.status(404).json({ m: "CoValue not found" });
    }

    updateCoValue(covalue, partialCovalue);
    res.status(204).send();

    // broadcast the mutation to subscribers
    broadcast(uuid);
});

app.patch("/covalue/:uuid/binary", (req: Request, res: Response) => {
    const { uuid } = req.params;
    const partialCovalue = req.body as Partial<CoValue>;

    const covalue = covalues[uuid];
    if (!covalue) {
        return res.status(404).json({ m: "CoValue not found" });
    }

    updateCoValueBinary(covalue, partialCovalue);
    res.status(204).send();

    // broadcast the mutation to subscribers
    broadcast(uuid);
});

interface Client {
    userAgentId: string;
    res: Response;
}
let clients: Client[] = [];

function broadcast(uuid: string): void {
    const event = events.get(uuid) as MutationEvent;
    const { type, ...data } = event;
    logger.debug(
        `[Broadcast to ${clients.length} clients] Mutation event of type: '${type}' was found for: ${uuid}.`,
    );

    clients.forEach((client) => {
        client.res.write(`event: ${type}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
}

app.get("/covalue/:uuid/subscribe/:ua", (req: Request, res: Response) => {
    const { uuid, ua } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    logger.debug(`[Client-#${ua}] Opening an event stream on: ${uuid}.`);
    const client: Client = {
        userAgentId: ua,
        res,
    };
    clients.push(client);

    // Clean up when the connection is closed
    req.on("close", () => {
        logger.debug(`[Client-#${ua}] Closed the event stream for: ${uuid}.`);
        clients = clients.filter((client) => client.userAgentId !== ua);
        res.end();
    });
});

app.post("/stop", async (req: Request, res: Response) => {
    performanceStore.writeToCSVFile();
    res.status(200).send({ m: `Performance data written to CSV. Server shutting down.` });

    if (PORT === "3001") {
        // also shutdown Caddy on TLS port 3000 via the `/stop` endpoint of the admin URL
        const caddyAdminUrl = "http://localhost:2019/stop";
        try {
            await fetch(`${caddyAdminUrl}`, { method: 'POST' });
            logger.debug("Caddy server shutdown successfully.");
        } catch (error) {
            logger.error("Error shutting down Caddy server:", error);
        }
    }

    logger.debug("Server shutdown");
    process.exit(0);
});

export function createWebServer(isHttp2: boolean, useTLS: boolean = true) {
    if (isHttp2) {
        // Start a HTTPS server using HTTP/2
        const server = spdy.createServer(tlsCert, app);
        server.listen(PORT, () => {
            logger.info(
                `HTTP/2 + TLSv1.3 Server is running on: https://localhost:${PORT}`,
            );
        });
    } else {
        if (useTLS) {
            // Start a HTTPS server using HTTP/1.1
            const server = https.createServer(tlsCert, app);
            server.listen(PORT, () => {
                logger.info(
                    `HTTP/1.1 + TLSv1.3 Server is running on: https://localhost:${PORT}`,
                );
            });
        } else {
            // Start a HTTP-only server using HTTP/1.1
            const server = http.createServer(app);
            server.listen(PORT, () => {
                logger.info(
                    `HTTP/1.1 Server is running on: http://localhost:${PORT}`,
                );
            });
        }
    }
}
