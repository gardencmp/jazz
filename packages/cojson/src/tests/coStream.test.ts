import { expect, test, describe } from "vitest";
import { expectStream } from "../coValue.js";
import { RawBinaryCoStream } from "../coValues/coStream.js";
import { MAX_RECOMMENDED_TX_SIZE, WasmCrypto } from "../index.js";
import { LocalNode } from "../localNode.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";

const Crypto = await WasmCrypto.create();

test("Empty CoStream works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
    });

    const content = expectStream(coValue.getCurrentContent());

    expect(content.type).toEqual("costream");
    expect(content.toJSON()).toEqual({});
    expect(content.getSingleStream()).toEqual(undefined);
});

test("Can push into CoStream", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
    });

    const content = expectStream(coValue.getCurrentContent());

    content.push({ hello: "world" }, "trusting");
    expect(content.toJSON()).toEqual({
        [node.currentSessionID]: [{ hello: "world" }],
    });
    content.push({ foo: "bar" }, "trusting");
    expect(content.toJSON()).toEqual({
        [node.currentSessionID]: [{ hello: "world" }, { foo: "bar" }],
    });
    expect(content.getSingleStream()).toEqual([
        { hello: "world" },
        { foo: "bar" },
    ]);
});

test("Empty RawBinaryCoStream works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: { type: "binary" },
        ...Crypto.createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (
        content.type !== "costream" ||
        content.headerMeta?.type !== "binary" ||
        !(content instanceof RawBinaryCoStream)
    ) {
        throw new Error("Expected binary stream");
    }

    expect(content.type).toEqual("costream");
    expect(content.headerMeta.type).toEqual("binary");
    expect(content.toJSON()).toEqual({});
    expect(content.getBinaryChunks()).toEqual(undefined);
});

test("Can push into RawBinaryCoStream", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: { type: "binary" },
        ...Crypto.createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (
        content.type !== "costream" ||
        content.headerMeta?.type !== "binary" ||
        !(content instanceof RawBinaryCoStream)
    ) {
        throw new Error("Expected binary stream");
    }

    content.startBinaryStream(
        { mimeType: "text/plain", fileName: "test.txt" },
        "trusting",
    );
    content.pushBinaryStreamChunk(new Uint8Array([1, 2, 3]), "trusting");
    content.pushBinaryStreamChunk(new Uint8Array([4, 5, 6]), "trusting");

    content.endBinaryStream("trusting");
    expect(content.getBinaryChunks()).toEqual({
        mimeType: "text/plain",
        fileName: "test.txt",
        chunks: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
        finished: true,
    });
});

test("When adding large transactions (small fraction of MAX_RECOMMENDED_TX_SIZE), we store an inbetween signature every time we reach MAX_RECOMMENDED_TX_SIZE and split up newContentSince accordingly", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: { type: "binary" },
        ...Crypto.createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (
        content.type !== "costream" ||
        content.headerMeta?.type !== "binary" ||
        !(content instanceof RawBinaryCoStream)
    ) {
        throw new Error("Expected binary stream");
    }

    content.startBinaryStream(
        { mimeType: "text/plain", fileName: "test.txt" },
        "trusting",
    );

    for (let i = 0; i < 10; i++) {
        const chunk = new Uint8Array(MAX_RECOMMENDED_TX_SIZE / 3 + 100);

        content.pushBinaryStreamChunk(chunk, "trusting");
    }

    content.endBinaryStream("trusting");

    const sessionEntry = coValue.sessionLogs.get(node.currentSessionID)!;
    expect(sessionEntry.transactions.length).toEqual(12);
    expect(sessionEntry.signatureAfter[0]).not.toBeDefined();
    expect(sessionEntry.signatureAfter[1]).not.toBeDefined();
    expect(sessionEntry.signatureAfter[2]).not.toBeDefined();
    expect(sessionEntry.signatureAfter[3]).toBeDefined();
    expect(sessionEntry.signatureAfter[4]).not.toBeDefined();
    expect(sessionEntry.signatureAfter[5]).not.toBeDefined();
    expect(sessionEntry.signatureAfter[6]).toBeDefined();
    expect(sessionEntry.signatureAfter[7]).not.toBeDefined();
    expect(sessionEntry.signatureAfter[8]).not.toBeDefined();
    expect(sessionEntry.signatureAfter[9]).toBeDefined();
    expect(sessionEntry.signatureAfter[10]).not.toBeDefined();
    expect(sessionEntry.signatureAfter[11]).not.toBeDefined();

    const newContent = coValue.newContentSince({
        id: coValue.id,
        header: false,
        sessions: {},
    })!;

    expect(newContent.length).toEqual(5);
    expect(newContent[0]!.header).toBeDefined();
    expect(newContent[1]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.signatureAfter[3],
    );
    expect(newContent[2]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.signatureAfter[6],
    );
    expect(newContent[3]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.signatureAfter[9],
    );
    expect(newContent[4]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.lastSignature,
    );
});

test("When adding large transactions (bigger than MAX_RECOMMENDED_TX_SIZE), we store an inbetween signature after every large transaction and split up newContentSince accordingly", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: { type: "binary" },
        ...Crypto.createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (
        content.type !== "costream" ||
        content.headerMeta?.type !== "binary" ||
        !(content instanceof RawBinaryCoStream)
    ) {
        throw new Error("Expected binary stream");
    }

    content.startBinaryStream(
        { mimeType: "text/plain", fileName: "test.txt" },
        "trusting",
    );

    const chunk = new Uint8Array(MAX_RECOMMENDED_TX_SIZE + 100);

    for (let i = 0; i < 3; i++) {
        content.pushBinaryStreamChunk(chunk, "trusting");
    }

    content.endBinaryStream("trusting");

    const sessionEntry = coValue.sessionLogs.get(node.currentSessionID)!;
    expect(sessionEntry.transactions.length).toEqual(5);
    expect(sessionEntry.signatureAfter[0]).not.toBeDefined();
    expect(sessionEntry.signatureAfter[1]).toBeDefined();
    expect(sessionEntry.signatureAfter[2]).toBeDefined();
    expect(sessionEntry.signatureAfter[3]).toBeDefined();
    expect(sessionEntry.signatureAfter[4]).not.toBeDefined();

    const newContent = coValue.newContentSince({
        id: coValue.id,
        header: false,
        sessions: {},
    })!;

    expect(newContent.length).toEqual(5);
    expect(newContent[0]!.header).toBeDefined();
    expect(newContent[1]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.signatureAfter[1],
    );
    expect(newContent[2]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.signatureAfter[2],
    );
    expect(newContent[3]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.signatureAfter[3],
    );
    expect(newContent[4]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.lastSignature,
    );
});

describe("isBinaryStreamEnded", () => {
    function setup() {
        const node = new LocalNode(
            ...randomAnonymousAccountAndSessionID(),
            Crypto,
        );

        const coValue = node.createCoValue({
            type: "costream",
            ruleset: { type: "unsafeAllowAll" },
            meta: { type: "binary" },
            ...Crypto.createdNowUnique(),
        });

        const content = coValue.getCurrentContent();

        if (
            content.type !== "costream" ||
            content.headerMeta?.type !== "binary" ||
            !(content instanceof RawBinaryCoStream)
        ) {
            throw new Error("Expected binary stream");
        }

        return content;
    }

    test("returns true when the last item is end", () => {
        const stream = setup();

        stream.startBinaryStream(
            { mimeType: "text/plain", fileName: "test.txt" },
            "trusting",
        );
        stream.endBinaryStream("trusting");

        expect(stream.isBinaryStreamEnded()).toBe(true);
    });

    test("returns false if the stream isn't ended", () => {
        const stream = setup();

        stream.startBinaryStream(
            { mimeType: "text/plain", fileName: "test.txt" },
            "trusting",
        );

        expect(stream.isBinaryStreamEnded()).toBe(false);
    });

    test("returns false if the stream isn't started", () => {
        const stream = setup();

        expect(stream.isBinaryStreamEnded()).toBe(false);
    });
});
