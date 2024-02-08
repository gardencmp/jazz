import { expect, describe, test, beforeEach } from "vitest";
import {
    BinaryCoStream,
    CoMapOf,
    CoStreamOf,
    SimpleAccount,
    imm,
    jazzReady,
} from "../index.js";
import { webcrypto } from "node:crypto";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { Effect, Queue } from "effect";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple BinaryCoStream operations", async () => {
    const me = await SimpleAccount.createControlledAccount({
        name: "Hermes Puggington",
    });

    const stream = new BinaryCoStream({ owner: me });

    test("Construction", () => {
        expect(stream.meta.owner.id).toEqual(me.id);
        expect(stream.getChunks()).toEqual(undefined);
    });

    describe("Mutation", () => {
        test("Start, pushes and end", () => {
            stream.start({
                mimeType: "text/plain",
                fileName: "test.txt",
                totalSizeBytes: 12,
            });
            stream.push(new Uint8Array([104, 101, 108, 108, 111]));
            stream.push(new Uint8Array([32, 119, 111, 114, 108]));
            stream.push(new Uint8Array([100, 33]));
            stream.end();
            expect(stream.getChunks({ allowUnfinished: true })).toEqual({
                chunks: [
                    new Uint8Array([104, 101, 108, 108, 111]),
                    new Uint8Array([32, 119, 111, 114, 108]),
                    new Uint8Array([100, 33]),
                ],
                mimeType: "text/plain",
                fileName: "test.txt",
                totalSizeBytes: 12,
                finished: true,
            });
        });
    });
});

describe("Loading & subscription", async () => {

});


