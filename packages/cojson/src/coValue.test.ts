import { accountOrAgentIDfromSessionID } from "./coValueCore.js";
import { BinaryCoStream } from "./coValues/coStream.js";
import { createdNowUnique } from "./crypto.js";
import { LocalNode } from "./node.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";

test("Empty CoMap works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

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

    const content = coValue.getCurrentContent();

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.type).toEqual("comap");

    content.edit((editable) => {
        editable.set("hello", "world", "trusting");
        expect(editable.get("hello")).toEqual("world");
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
        expect([...editable.keys()]).toEqual(["hello", "foo"]);
        editable.delete("foo", "trusting");
        expect(editable.get("foo")).toEqual(undefined);
    });
});

test("Can get CoMap entry values at different points in time", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.type).toEqual("comap");

    content.edit((editable) => {
        const beforeA = Date.now();
        while (Date.now() < beforeA + 10) {}
        editable.set("hello", "A", "trusting");
        const beforeB = Date.now();
        while (Date.now() < beforeB + 10) {}
        editable.set("hello", "B", "trusting");
        const beforeC = Date.now();
        while (Date.now() < beforeC + 10) {}
        editable.set("hello", "C", "trusting");
        expect(editable.get("hello")).toEqual("C");
        expect(editable.getAtTime("hello", Date.now())).toEqual("C");
        expect(editable.getAtTime("hello", beforeA)).toEqual(undefined);
        expect(editable.getAtTime("hello", beforeB)).toEqual("A");
        expect(editable.getAtTime("hello", beforeC)).toEqual("B");
    });
});

test("Can get all historic values of key in CoMap", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.type).toEqual("comap");

    content.edit((editable) => {
        editable.set("hello", "A", "trusting");
        const txA = editable.getLastTxID("hello");
        editable.set("hello", "B", "trusting");
        const txB = editable.getLastTxID("hello");
        editable.delete("hello", "trusting");
        const txDel = editable.getLastTxID("hello");
        editable.set("hello", "C", "trusting");
        const txC = editable.getLastTxID("hello");
        expect(editable.getHistory("hello")).toEqual([
            {
                txID: txA,
                value: "A",
                at: txA && coValue.getTx(txA)?.madeAt,
            },
            {
                txID: txB,
                value: "B",
                at: txB && coValue.getTx(txB)?.madeAt,
            },
            {
                txID: txDel,
                value: undefined,
                at: txDel && coValue.getTx(txDel)?.madeAt,
            },
            {
                txID: txC,
                value: "C",
                at: txC && coValue.getTx(txC)?.madeAt,
            },
        ]);
    });
});

test("Can get last tx ID for a key in CoMap", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.type).toEqual("comap");

    content.edit((editable) => {
        expect(editable.getLastTxID("hello")).toEqual(undefined);
        editable.set("hello", "A", "trusting");
        const sessionID = editable.getLastTxID("hello")?.sessionID;
        expect(sessionID && accountOrAgentIDfromSessionID(sessionID)).toEqual(
            node.account.id
        );
        expect(editable.getLastTxID("hello")?.txIndex).toEqual(0);
        editable.set("hello", "B", "trusting");
        expect(editable.getLastTxID("hello")?.txIndex).toEqual(1);
        editable.set("hello", "C", "trusting");
        expect(editable.getLastTxID("hello")?.txIndex).toEqual(2);
    });
});

test("Empty CoList works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (content.type !== "colist") {
        throw new Error("Expected list");
    }

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

    const content = coValue.getCurrentContent();

    if (content.type !== "colist") {
        throw new Error("Expected list");
    }

    expect(content.type).toEqual("colist");

    content.edit((editable) => {
        editable.append(0, "hello", "trusting");
        expect(editable.toJSON()).toEqual(["hello"]);
        editable.append(0, "world", "trusting");
        expect(editable.toJSON()).toEqual(["hello", "world"]);
        editable.prepend(1, "beautiful", "trusting");
        expect(editable.toJSON()).toEqual(["hello", "beautiful", "world"]);
        editable.prepend(3, "hooray", "trusting");
        expect(editable.toJSON()).toEqual([
            "hello",
            "beautiful",
            "world",
            "hooray",
        ]);
        editable.delete(2, "trusting");
        expect(editable.toJSON()).toEqual(["hello", "beautiful", "hooray"]);
    });
});

test("Push is equivalent to append after last item", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (content.type !== "colist") {
        throw new Error("Expected list");
    }

    expect(content.type).toEqual("colist");

    content.edit((editable) => {
        editable.append(0, "hello", "trusting");
        expect(editable.toJSON()).toEqual(["hello"]);
        editable.push("world", "trusting");
        expect(editable.toJSON()).toEqual(["hello", "world"]);
        editable.push("hooray", "trusting");
        expect(editable.toJSON()).toEqual(["hello", "world", "hooray"]);
    });
});

test("Can push into empty list", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (content.type !== "colist") {
        throw new Error("Expected list");
    }

    expect(content.type).toEqual("colist");

    content.edit((editable) => {
        editable.push("hello", "trusting");
        expect(editable.toJSON()).toEqual(["hello"]);
    });
});

test("Empty CoStream works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = coValue.getCurrentContent();

    if (content.type !== "costream") {
        throw new Error("Expected stream");
    }

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

    const content = coValue.getCurrentContent();

    if (content.type !== "costream") {
        throw new Error("Expected stream");
    }

    content.edit((editable) => {
        editable.push({ hello: "world" }, "trusting");
        expect(editable.toJSON()).toEqual({
            [node.currentSessionID]: [{ hello: "world" }],
        });
        editable.push({ foo: "bar" }, "trusting");
        expect(editable.toJSON()).toEqual({
            [node.currentSessionID]: [{ hello: "world" }, { foo: "bar" }],
        });
        expect(editable.getSingleStream()).toEqual([
            { hello: "world" },
            { foo: "bar" },
        ]);
    });
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

    if (content.type !== "costream" || content.meta?.type !== "binary" || !(content instanceof BinaryCoStream)) {
        throw new Error("Expected binary stream");
    }

    expect(content.type).toEqual("costream");
    expect(content.meta.type).toEqual("binary");
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

    if (content.type !== "costream" || content.meta?.type !== "binary" || !(content instanceof BinaryCoStream)) {
        throw new Error("Expected binary stream");
    }

    content.edit((editable) => {
        editable.startBinaryStream({mimeType: "text/plain", fileName: "test.txt"}, "trusting");
        expect(editable.getBinaryChunks()).toEqual({
            mimeType: "text/plain",
            fileName: "test.txt",
            chunks: [],
            finished: false,
        });
    });
});
