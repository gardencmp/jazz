import { expectList, expectMap, expectStream } from "../coValue.js";
import { BinaryCoStream } from "../coValues/coStream.js";
import { createdNowUnique } from "../crypto.js";
import { MAX_RECOMMENDED_TX_SIZE, cojsonReady } from "../index.js";
import { LocalNode } from "../localNode.js";
import { accountOrAgentIDfromSessionID } from "../typeUtils/accountOrAgentIDfromSessionID.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";

beforeEach(async () => {
    await cojsonReady;
});

test("Empty CoMap works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectMap(coValue.getCurrentContent());

    expect(content.type).toEqual("comap");
    expect([...content.keys()]).toEqual([]);
    expect(content.toJSON()).toEqual({});
});

test("Can insert and delete CoMap entries in edit()", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectMap(coValue.getCurrentContent());

    expect(content.type).toEqual("comap");

    content.set("hello", "world", "trusting");
    expect(content.get("hello")).toEqual("world");
    content.set("foo", "bar", "trusting");
    expect(content.get("foo")).toEqual("bar");
    expect([...content.keys()]).toEqual(["hello", "foo"]);
    content.delete("foo", "trusting");
    expect(content.get("foo")).toEqual(undefined);
});

test("Can get CoMap entry values at different points in time", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectMap(coValue.getCurrentContent());

    expect(content.type).toEqual("comap");

    const beforeA = Date.now();
    while (Date.now() < beforeA + 10) {}
    content.set("hello", "A", "trusting");
    const beforeB = Date.now();
    while (Date.now() < beforeB + 10) {}
    content.set("hello", "B", "trusting");
    const beforeC = Date.now();
    while (Date.now() < beforeC + 10) {}
    content.set("hello", "C", "trusting");
    expect(content.get("hello")).toEqual("C");
    expect(content.atTime(Date.now()).get("hello")).toEqual("C");
    expect(content.atTime(beforeA).get("hello")).toEqual(undefined);
    expect(content.atTime(beforeB).get("hello")).toEqual("A");
    expect(content.atTime(beforeC).get("hello")).toEqual("B");
});

test("Can get all historic values of key in CoMap", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectMap(coValue.getCurrentContent());

    expect(content.type).toEqual("comap");

    content.set("hello", "A", "trusting");
    const editA = content.lastEditAt("hello");
    content.set("hello", "B", "trusting");
    const editB = content.lastEditAt("hello");
    content.delete("hello", "trusting");
    const editDel = content.lastEditAt("hello");
    content.set("hello", "C", "trusting");
    const editC = content.lastEditAt("hello");
    expect([...content.editsAt("hello")]).toEqual([
        {
            tx: editA!.tx,
            by: node.account.id,
            value: "A",
            at: editA?.at,
        },
        {
            tx: editB!.tx,
            by: node.account.id,
            value: "B",
            at: editB?.at,
        },
        {
            tx: editDel!.tx,
            by: node.account.id,
            value: undefined,
            at: editDel?.at,
        },
        {
            tx: editC!.tx,
            by: node.account.id,
            value: "C",
            at: editC?.at,
        },
    ]);
});

test("Can get last tx ID for a key in CoMap", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectMap(coValue.getCurrentContent());

    expect(content.type).toEqual("comap");

    expect(content.lastEditAt("hello")).toEqual(undefined);
    content.set("hello", "A", "trusting");
    const sessionID = content.lastEditAt("hello")?.tx.sessionID;
    expect(sessionID && accountOrAgentIDfromSessionID(sessionID)).toEqual(
        node.account.id
    );
    expect(content.lastEditAt("hello")?.tx.txIndex).toEqual(0);
    content.set("hello", "B", "trusting");
    expect(content.lastEditAt("hello")?.tx.txIndex).toEqual(1);
    content.set("hello", "C", "trusting");
    expect(content.lastEditAt("hello")?.tx.txIndex).toEqual(2);
});

test("Empty CoList works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectList(coValue.getCurrentContent());

    expect(content.type).toEqual("colist");
    expect(content.toJSON()).toEqual([]);
});

test("Can append, prepend and delete items to CoList", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectList(coValue.getCurrentContent());

    content.append("hello", 0, "trusting");
    expect(content.toJSON()).toEqual(["hello"]);
    content.append("world", 0, "trusting");
    expect(content.toJSON()).toEqual(["hello", "world"]);
    content.prepend("beautiful", 1, "trusting");
    expect(content.toJSON()).toEqual(["hello", "beautiful", "world"]);
    content.prepend("hooray", 3, "trusting");
    expect(content.toJSON()).toEqual(["hello", "beautiful", "world", "hooray"]);
    content.delete(2, "trusting");
    expect(content.toJSON()).toEqual(["hello", "beautiful", "hooray"]);
});

test("Push is equivalent to append after last item", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectList(coValue.getCurrentContent());

    expect(content.type).toEqual("colist");

    content.append("hello", 0, "trusting");
    expect(content.toJSON()).toEqual(["hello"]);
    content.append("world", undefined, "trusting");
    expect(content.toJSON()).toEqual(["hello", "world"]);
    content.append("hooray", undefined, "trusting");
    expect(content.toJSON()).toEqual(["hello", "world", "hooray"]);
});

test("Can push into empty list", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectList(coValue.getCurrentContent());

    expect(content.type).toEqual("colist");

    content.append("hello", undefined, "trusting");
    expect(content.toJSON()).toEqual(["hello"]);
});

test("Empty CoStream works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectStream(coValue.getCurrentContent());

    expect(content.type).toEqual("costream");
    expect(content.toJSON()).toEqual({});
    expect(content.getSingleStream()).toEqual(undefined);
});

test("Can push into CoStream", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
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

test("Empty BinaryCoStream works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: { type: "binary" },
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (
        content.type !== "costream" ||
        content.headerMeta?.type !== "binary" ||
        !(content instanceof BinaryCoStream)
    ) {
        throw new Error("Expected binary stream");
    }

    expect(content.type).toEqual("costream");
    expect(content.headerMeta.type).toEqual("binary");
    expect(content.toJSON()).toEqual({});
    expect(content.getBinaryChunks()).toEqual(undefined);
});

test("Can push into BinaryCoStream", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: { type: "binary" },
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (
        content.type !== "costream" ||
        content.headerMeta?.type !== "binary" ||
        !(content instanceof BinaryCoStream)
    ) {
        throw new Error("Expected binary stream");
    }

    content.startBinaryStream(
        { mimeType: "text/plain", fileName: "test.txt" },
        "trusting"
    );
    expect(content.getBinaryChunks(true)).toEqual({
        mimeType: "text/plain",
        fileName: "test.txt",
        chunks: [],
        finished: false,
    });
    content.pushBinaryStreamChunk(new Uint8Array([1, 2, 3]), "trusting");
    expect(content.getBinaryChunks(true)).toEqual({
        mimeType: "text/plain",
        fileName: "test.txt",
        chunks: [new Uint8Array([1, 2, 3])],
        finished: false,
    });
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
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: { type: "binary" },
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (
        content.type !== "costream" ||
        content.headerMeta?.type !== "binary" ||
        !(content instanceof BinaryCoStream)
    ) {
        throw new Error("Expected binary stream");
    }

    content.startBinaryStream(
        { mimeType: "text/plain", fileName: "test.txt" },
        "trusting"
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
        sessionEntry.signatureAfter[3]
    );
    expect(newContent[2]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.signatureAfter[6]
    );
    expect(newContent[3]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.signatureAfter[9]
    );
    expect(newContent[4]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.lastSignature
    );
});

test("When adding large transactions (bigger than MAX_RECOMMENDED_TX_SIZE), we store an inbetween signature after every large transaction and split up newContentSince accordingly", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: { type: "binary" },
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (
        content.type !== "costream" ||
        content.headerMeta?.type !== "binary" ||
        !(content instanceof BinaryCoStream)
    ) {
        throw new Error("Expected binary stream");
    }

    content.startBinaryStream(
        { mimeType: "text/plain", fileName: "test.txt" },
        "trusting"
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
        sessionEntry.signatureAfter[1]
    );
    expect(newContent[2]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.signatureAfter[2]
    );
    expect(newContent[3]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.signatureAfter[3]
    );
    expect(newContent[4]!.new[node.currentSessionID]!.lastSignature).toEqual(
        sessionEntry.lastSignature
    );
});
