import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";
import winston from "winston";
import fs from "fs";
import WebSocket from "ws";

export const port = process.env.PORT || 3000;

export const tlsCert = {
    key: fs.readFileSync("cert/localhost+1-key.pem"),
    cert: fs.readFileSync("cert/localhost+1.pem"),
};

export const CHUNK_SIZE = 100 * 1024; // 100KB chunk

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${level}: [${timestamp}] ${message}`;
});

export const logger = winston.createLogger({
    level: "debug",
    format: winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        customFormat,
    ),
    transports: [new winston.transports.Console()],
    silent: false,
});

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

export class WebSocketResponse {
    private ws: WebSocket;
    private wss: WebSocket.Server;
    private actionName: string = "";
    private statusCode: number = 200;

    constructor(ws: WebSocket, wss: WebSocket.Server) {
        this.ws = ws;
        this.wss = wss;
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
        this.ws.send(
            JSON.stringify({
                action: this.actionName,
                code: this.statusCode,
                payload: data,
            }),
        );
    }

    broadcast(data: object, ws: WebSocket): void {
        this.wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(
                    JSON.stringify({
                        action: this.actionName,
                        code: this.statusCode,
                        payload: data,
                    }),
                );
            }
        });
    }

    send(data: BufferLike, cb?: (err?: Error) => void): void {
        this.ws.send(data, cb);
    }
}
