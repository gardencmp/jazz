import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import WebSocket from "ws";
import * as uWS from "uWebSockets.js";
import logger from "./logger";
import os from "os";

export const PORT = process.env.PORT || 3000;
export const CHUNK_SIZE = 100 * 1024; // 100KB chunk

faker.seed(500); // a fixed seed minimizes random data variation between test runs for each server

export interface CoValue {
    uuid: string;
    lastUpdated: Date;
    author: string;
    title: string;
    summary: string;
    preview: string;
    url?: File;
    file?: File;
}

export interface File {
    name: string;
    path?: string;
    data?: string;
}

export interface MutationEvent {
    type: "text" | "binary";
    field?: string;
    value?: string;
}

export function createRandomCoValue() {
    return {
        uuid: faker.string.uuid(),
        lastUpdated: faker.date.past(),
        author: faker.person.fullName(),
        title: faker.lorem.words({ min: 3, max: 5 }),
        summary: faker.lorem.sentence(),
        preview: faker.lorem.lines({ min: 100, max: 100 }), // 100 lines ~= 5KB of text
        url: { name: "sample.zip", path: "public/downloads/sample.zip" },
    };
}

const _covalues: CoValue[] = faker.helpers.multiple(createRandomCoValue, {
    count: 5,
});

export const covalues: Record<string, CoValue> = _covalues.reduce(
    (acc, covalue) => {
        acc[covalue.uuid] = covalue;
        return acc;
    },
    {} as Record<string, CoValue>,
);

export const firstCoValue = (() => {
    const keys = Object.keys(covalues);
    const index = 0;
    return {
        uuid: keys[index],
        index: index + 1
    };
})();

export const events = new Map<string, MutationEvent>();

export function addCoValue(
    covalues: Record<string, CoValue>,
    covalue: CoValue,
): void {
    let uuid;
    const newCoValue: CoValue = { ...covalue };
    if (newCoValue.uuid) {
        uuid = newCoValue.uuid;
    } else {
        uuid = uuidv4();
        newCoValue.uuid = uuid;
    }
    newCoValue.lastUpdated = new Date();
    covalues[uuid] = newCoValue;
}

function _updateCoValue(covalue: CoValue, event?: MutationEvent): void {
    covalue.lastUpdated = new Date();

    if (event) {
        logger.debug(
            `Adding a mutation event of type '${event.type}' for: ${covalue.uuid}.`,
        );
        events.set(covalue.uuid, event);
    } else {
        logger.warn(
            `No VALID mutation event was present in the request for: ${covalue.uuid}.`,
        );
    }
}

export function updateCoValue(
    covalue: CoValue,
    partialCovalue: Partial<CoValue>,
): void {
    let event: MutationEvent | undefined = undefined;

    // Only update fields present in the request body
    if (partialCovalue.author) {
        covalue.author = partialCovalue.author;
        event = { type: "text", field: "author", value: covalue.author };
    }
    if (partialCovalue.title) {
        covalue.title = partialCovalue.title;
        event = { type: "text", field: "title", value: covalue.title };
    }
    if (partialCovalue.summary) {
        covalue.summary = partialCovalue.summary;
        event = { type: "text", field: "summary", value: covalue.summary };
    }
    if (partialCovalue.preview) {
        covalue.preview = partialCovalue.preview;
        event = { type: "text", field: "preview", value: covalue.preview };
    }

    _updateCoValue(covalue, event);
}

export function updateCoValueBinary(
    covalue: CoValue,
    partialCovalue: Partial<CoValue>,
): void {
    let event: MutationEvent | undefined = undefined;

    if (partialCovalue.file) {
        covalue.file = partialCovalue.file;

        // if (covalue.file.name) {
        //   event = {
        //     type: "binary",
        //     field: "file.name",
        //     value: covalue.file.name,
        //   };
        // }
        if (covalue.file.data) {
            event = {
                type: "binary",
                field: "file.data",
                value: covalue.file.data,
            };
        }
    }

    _updateCoValue(covalue, event);
}

export function formatClientNumber(object:any, width: number = 2) {
    if (!object) {
        return "00";
    }

    if (object && object.ua) {
        if (object.ua.length == width) {
            return object.ua;
        } else if (object.ua.length < width) {
            return `0${object.ua}`;
        }
    } else {
        return "00";
    }
}

export function parseUUIDAndUAFromCookie(req: any) {
    const cookieHeader = req.getHeader('cookie');

    if (!cookieHeader) {
        return { uuid: null, ua: null };
    }

    const uuidMatch = cookieHeader.match(/uuid=([^;]+)/);
    const uaMatch = cookieHeader.match(/ua=([^;]+)/);

    return {
        uuid: uuidMatch ? uuidMatch[1] : null,
        ua: uaMatch ? uaMatch[1] : null
    };
}

// BufferLike partial copy from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/ac8b76bf4ccc707b38e8b2ec8b0a3cb42bd83bf5/types/ws/index.d.ts#L20
type BufferLike =
    | string
    | Buffer
    | DataView
    | number
    | ArrayBufferView
    | Uint8Array
    | ArrayBuffer
    | SharedArrayBuffer;

/**
 * Abstract base class for WebSocket responses, parameterized by the WebSocket implementation.
 */
export abstract class WebSocketResponseBase<TWebSocket> {
    protected ws: TWebSocket;
    protected actionName: string = "";
    protected statusCode: number = 200;

    constructor(ws: TWebSocket) {
        this.ws = ws;
    }

    action(action: string): this {
        this.actionName = action;
        return this;
    }

    status(code: number): this {
        this.statusCode = code;
        return this;
    }

    json(data: object): void {
        this.send(
            JSON.stringify({
                action: this.actionName,
                code: this.statusCode,
                payload: data,
            })
        );
    }

    /**
     * Abstract method for sending data to the WebSocket.
     * @param data The data to send.
     * @param callback Optional callback for error handling.
     */
    abstract send(data: BufferLike, callback?: (err?: Error) => void): void;

    /**
     * Abstract method for broadcasting data to other clients.
     * @param data The data to broadcast.
     */
    abstract broadcast(data: object): void;
}

/**
 * Implementation for WebSocket using the `ws` library.
 */
export class WebSocketResponse extends WebSocketResponseBase<WebSocket> {
    private wss: WebSocket.Server;

    constructor(ws: WebSocket, wss: WebSocket.Server) {
        super(ws);
        this.wss = wss;
    }

    send(data: BufferLike, cb?: (err?: Error) => void): void {
        this.ws.send(data, cb);
    }

    broadcast(data: object): void {
        this.wss.clients.forEach((client) => {
            if (client !== this.ws && client.readyState === WebSocket.OPEN) {
                client.send(
                    JSON.stringify({
                        action: this.actionName,
                        code: this.statusCode,
                        payload: data,
                    })
                );
            }
        });
    }
}

/**
 * Implementation for WebSocket using `uWebSockets.js`.
 */
export class uWebSocketResponse extends WebSocketResponseBase<uWS.WebSocket<{}>> {
    private topic: string;

    constructor(ws: uWS.WebSocket<{}>, topic: string) {
        super(ws);
        this.topic = topic;
    }

    send(data: any, callback?: (error?: Error) => void): void {
        try {
            if (typeof data !== "string") {
                this.ws.send(data, true);
            } else {
                this.ws.send(data);
            }
            callback?.();
        } catch (error) {
            callback?.(error as Error);
        }
    }

    broadcast(data: object): void {
        this.ws.publish(
            this.topic,
            JSON.stringify({
                action: this.actionName,
                code: this.statusCode,
                payload: data,
            }),
            false
        );
    }
}

export interface PerformanceEntry {
    requestId?: string;
    method: string;
    path: string;
    statusCode: number;
    timestamp: string;
    duration: number;
    durationInMillis: string;
}

export class PerformanceTimer {
    private requestId: string;
    private start: number;
    private timestamp: string;
    private methodName: string = "";
    private pathString: string = "";
    private statusCode: number = -1;
    private duration: number = -1;
    private durationInMillis: string = "";

    constructor(requestId: string) {
        this.requestId = requestId;
        this.start = performance.now();
        this.timestamp = new Date().toISOString();
    }

    method(method: string): PerformanceTimer {
        this.methodName = method;
        return this;
    }

    path(path: string): PerformanceTimer {
        this.pathString = path;
        return this;
    }

    status(statusCode: number): PerformanceTimer {
        this.statusCode = statusCode;
        return this;
    }

    end(): void {
        this.duration = performance.now() - this.start;

    }

}

export class PerformanceStore {
    private entries: PerformanceEntry[] = [];
    private requestCounter: number = 0;

    addEntry(entry: PerformanceEntry): void {
        this.entries.push(entry);
    }

    aggregateMultipleEntries(): void {
        interface Accumulator {
            remaining: PerformanceEntry[];
            aggregate: number;
        }

        const result = this.entries.reduce<Accumulator>((acc, entry) => {
            if (entry.method === "POST" && entry.path === "/covalue/binary") {
                return entry.statusCode === 200
                    ? { remaining: acc.remaining, aggregate: acc.aggregate + entry.duration }
                    : entry.statusCode === 201
                        ? { remaining: [...acc.remaining, { ...entry, duration: entry.duration + acc.aggregate, durationInMillis: (entry.duration + acc.aggregate).toFixed(2) }], aggregate: 0 }
                        : { remaining: [...acc.remaining, entry], aggregate: acc.aggregate };
            }
            return { remaining: [...acc.remaining, entry], aggregate: acc.aggregate };
        }, { remaining: [], aggregate: 0 });

        this.entries = result.remaining;
    }

    writeToCSVFile(filename: string = 'time.csv'): void {
        const outputPath = `public/${filename}`;
        const outDir = path.dirname(outputPath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        // sum up the duration of multiple chunked POST requests into a single duration
        this.aggregateMultipleEntries();

        // Write performance data to CSV
        const csvHeaders = 'RequestID,Method,Path,StatusCode,Timestamp,Duration,Duration (milliseconds)';
        const csvContent = this.entries
        .map(entry => `${entry.requestId},${entry.method},${entry.path},${entry.statusCode},${entry.timestamp},${entry.duration},${entry.durationInMillis}`)
        .join(os.EOL);

        fs.writeFileSync(outputPath, csvHeaders + os.EOL + csvContent);
        logger.debug(`Performance data written to CSV: ${outputPath}`);

        // Clear the store after writing to disk
        this.entries = [];
    }

    getRequestCounter(): number {
        return ++this.requestCounter;
    }
}