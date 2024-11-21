import express, { Request, Response } from "express";
import https from "https";
import spdy from "spdy";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import {
    CoValue,
    File,
    MutationEvent,
    covalues,
    events,
    addCoValue,
    updateCoValue,
    updateCoValueBinary,
    tlsCert,
    logger,
    port,
    CHUNK_SIZE,
} from "../util";
import { FileStreamManager, UploadBody } from "./filestream-manager";

const app = express();
const fileManager = new FileStreamManager();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static("public/client/http"));
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
        return res.status(404).json({ m: "CoValue not found." });
    }

    const filePath = covalue.url?.path as string;
    if (!filePath) {
        return res.status(404).json({ m: "CoValue binary file not found." });
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

export function createHTTPServer(isHttp2: boolean) {
    if (isHttp2) {
        // Start a HTTPS server using HTTP/2
        const server = spdy.createServer(tlsCert, app);
        server.listen(port, () => {
            logger.info(
                `HTTP/2 + TLSv1.3 Server is running on: https://localhost:${port}`,
            );
        });
    } else {
        // Start a HTTPS server using HTTP/1.1
        const server = https.createServer(tlsCert, app);
        server.listen(port, () => {
            logger.info(
                `HTTP/1.1 + TLSv1.3 Server is running on: https://localhost:${port}`,
            );
        });
    }
}
