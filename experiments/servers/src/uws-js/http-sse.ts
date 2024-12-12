import uWS from "uWebSockets.js";
import path from "path";
import fs from "fs";
import { lookup } from "mime-types";
import {
    CoValue,
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
import { FileStreamManager, UploadBody } from "../node-js/filestream-manager";

const fileManager = new FileStreamManager();

const app = uWS.SSLApp({
    key_file_name: tlsCertPath.tlsKeyName,
    cert_file_name: tlsCertPath.tlsCertName
});

// Serve static files
const rootDir = path.resolve(__dirname, "../..");
const staticDir =
    process.env.NODE_ENV === "production"
        ? path.join(rootDir, "dist", "public")
        : path.join(rootDir, "public");

app.get("/covalue", (res, req) => {
    const query = req.getQuery();
    const searchParams = new URLSearchParams(query);
    const all = searchParams.get('all') === 'true';

    res.writeHeader('Content-Type', 'application/json');
    if (all) {
        res.end(JSON.stringify(Object.values(covalues)));
    } else {
        res.end(JSON.stringify(Object.keys(covalues)));
    }
});

app.get("/covalue/:uuid", (res, req) => {
    const uuid = req.getParameter(0);
    if (!uuid) {
        res.writeStatus('404').end(JSON.stringify({ m: "CoValue not found" }));
        return;        
    }
    const covalue = covalues[uuid];
    res.writeHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(covalue));
});

app.get("/covalue/:uuid/binary", (res, req) => {
    const uuid = req.getParameter(0);
    if (!uuid) {
        res.writeStatus('404').end(JSON.stringify({ m: "CoValue not found" }));
        return;
    }

    const covalue = covalues[uuid];
    const filePath = covalue.url?.path as string;
    if (!filePath) {
        res.writeStatus('404').end(JSON.stringify({ m: "CoValue binary file not found" }));
        return;
    }

    // Capture range header
    const rangeHeader = req.getHeader('range');

    fileManager.chunkFileDownload(
        {
            filePath,
            range: rangeHeader,
        },
        {
            type: "http",
            res: {
                status: (code: number) => {
                    return {
                        json: (data: any) => {
                            res.cork(() => {
                                res.writeStatus(`${code}`);
                                res.writeHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify(data));
                            });
                        }
                    }
                },
                
                writeHead: (code: number, headers: any) => {
                    res.cork(() => {
                        res.writeStatus(`${code}`);
                        for (const key in headers) {
                            res.writeHeader(key, `${headers[key]}`)
                        }    
                    });
                },
                
                write: (data: any, callback?: (error?: Error) => void) => {
                    res.cork(() => {
                        try {
                            res.write(data)
                            callback?.();
                        } catch (error) {
                            callback?.(error as Error);
                        }    
                    });
                },
                
                end: (data?: any) => res.cork(() => { res.end(data) })
            } as any
        }
    );

    res.onAborted(() => {
        /* Request was prematurely aborted, stop reading */
        logger.debug(`Binary CoValue file download aborted`);
    });

});

app.post("/covalue", (res) => {
    let buffer = Buffer.alloc(0);

    res.onData((chunk: ArrayBuffer, isLast: boolean) => {
        const chunkBuffer = Buffer.from(chunk);
        buffer = Buffer.concat([buffer, chunkBuffer]);

        logger.debug('Got chunk of data with length ' + chunk.byteLength + ', isLast: ' + isLast);

        let covalue;
        if (isLast) {
            covalue = JSON.parse(buffer.toString());
        } else {
            return;
        }
        
        if (!covalue) {
            res.writeStatus('400').end(JSON.stringify({ m: "CoValue cannot be blank" }));
            return;
        }

        addCoValue(covalues, covalue);
        res.writeStatus('201').end(JSON.stringify({ m: "OK" }));
    });

    res.onAborted(() => {
        logger.debug(`Text-based CoValue creation aborted`);
    });
});

app.post("/covalue/binary", (res, req) => {
    let body = '';
    res.onData((chunk, isLast) => {
        body += Buffer.from(chunk).toString();

        if (isLast) {
            const payload: UploadBody = JSON.parse(body);
            fileManager.chunkFileUpload(payload, {
      
                status: (code: number) => {
                    return {
                        json: (data: any) => {
                            res.cork(() => {
                                res.writeStatus(`${code}`);
                                res.writeHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify(data));
                            });
                        }
                    }
                }
            } as any);    
        }
    });

    res.onAborted(() => {
        logger.debug(`Binary CoValue creation aborted`);
    });

});

app.patch("/covalue/:uuid", (res, req) => {
    const uuid = req.getParameter(0);
    if (!uuid) {
        res.writeStatus('404').end(JSON.stringify({ m: "CoValue not found" }));
        return;
    }
    
    res.onData((chunk) => {
        const body = Buffer.from(chunk).toString();
        const partialCovalue = JSON.parse(body);
        const covalue = covalues[uuid];

        updateCoValue(covalue, partialCovalue);
        res.writeStatus('204').end();

        // Broadcast the mutation to subscribers
        broadcast(uuid);
    });

    res.onAborted(() => {
        logger.debug(`Text-based CoValue mutation aborted`);
    });
});

app.patch("/covalue/:uuid/binary", (res, req) => {
    const uuid = req.getParameter(0);
    if (!uuid) {
        res.writeStatus('404').end(JSON.stringify({ m: "CoValue not found" }));
        return;
    }

    let body = '';
    res.onData((chunk, isLast) => {
        body += Buffer.from(chunk).toString();

        if (isLast) {
            const partialCovalue = JSON.parse(body);
            const covalue = covalues[uuid];
            updateCoValueBinary(covalue, partialCovalue);
            res.writeStatus('204').end();
    
            // Broadcast the mutation to subscribers
            broadcast(uuid);
        }
    });
    
    res.onAborted(() => {
        logger.debug(`Binary CoValue mutation aborted`);
    });
});

// SSE-like subscription handling
interface Client {
    userAgentId: string;
    res: uWS.HttpResponse;
}
let clients: Client[] = [];

function broadcast(uuid: string): void {
    const event = events.get(uuid) as MutationEvent;
    const { type, ...data } = event;
    logger.debug(
        `[Broadcast to ${clients.length} clients] Mutation event of type: '${type}' was found for: ${uuid}.`,
    );

    clients.forEach((client) => {
        client.res.writeHeader('Content-Type', 'text/event-stream');
        client.res.writeHeader('Cache-Control', 'no-cache');
        client.res.writeHeader('Connection', 'keep-alive');
        client.res.write(`event: ${type}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
}

// Subscription
app.get("/covalue/:uuid/subscribe/:ua", (res, req) => {
    const uuid = req.getParameter(0)!;
    const ua = req.getParameter(1)!;

    res.writeHeader('Content-Type', 'text/event-stream');
    res.writeHeader('Cache-Control', 'no-cache');
    res.writeHeader('Connection', 'keep-alive');

    logger.debug(`[Client-#${ua}] Opening an event stream on: ${uuid}.`);
    const client: Client = {
        userAgentId: ua,
        res,
    };
    clients.push(client);

    // Keep the connection open
    res.onAborted(() => {
        logger.debug(`[Client-#${ua}] Closed the event stream for: ${uuid}.`);
        clients = clients.filter((client) => client.userAgentId !== ua);
    });
});

// Serve static files
app.get("/*", (res, req) => {
    const url = req.getUrl();
    const prefix = "/faker";

    try {
        if (url === "/") {
            const filePath = path.join(staticDir, "client", "http", "index.html");
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
});


app.listen(+PORT, (token) => {
    if (token) {
        logger.info(
            `HTTP/1.1 + TLSv1.3 Server is running on: https://localhost:${PORT}`,
        );
    } else {
        logger.error(`Failed to start server on port: ${PORT}`);
    }
});
