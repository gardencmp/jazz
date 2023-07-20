import { test, expect } from "bun:test";
import {
    agentIDfromSessionID,
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from "./multilog";
import { LocalNode } from "./node";

test("Empty COJSON Map works", () => {
    const agentCredential = newRandomAgentCredential();
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const multilog = node.createMultiLog({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
    });

    const content = multilog.getCurrentContent();

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.type).toEqual("comap");
    expect([...content.keys()]).toEqual([]);
    expect(content.toJSON()).toEqual({});
});

test("Can insert and delete Map entries in edit()", () => {
    const agentCredential = newRandomAgentCredential();
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const multilog = node.createMultiLog({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
    });

    const content = multilog.getCurrentContent();

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.type).toEqual("comap");

    content.edit((editable) => {
        editable.set("hello", "world");
        expect(editable.get("hello")).toEqual("world");
        editable.set("foo", "bar");
        expect(editable.get("foo")).toEqual("bar");
        expect([...editable.keys()]).toEqual(["hello", "foo"]);
        editable.delete("foo");
        expect(editable.get("foo")).toEqual(undefined);
    });
});

test("Can get map entry values at different points in time", () => {
    const agentCredential = newRandomAgentCredential();
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const multilog = node.createMultiLog({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
    });

    const content = multilog.getCurrentContent();

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.type).toEqual("comap");

    content.edit((editable) => {
        const beforeA = Date.now();
        Bun.sleepSync(1);
        editable.set("hello", "A");
        const beforeB = Date.now();
        Bun.sleepSync(1);
        editable.set("hello", "B");
        const beforeC = Date.now();
        Bun.sleepSync(1);
        editable.set("hello", "C");
        expect(editable.get("hello")).toEqual("C");
        expect(editable.getAtTime("hello", Date.now())).toEqual("C");
        expect(editable.getAtTime("hello", beforeA)).toEqual(undefined);
        expect(editable.getAtTime("hello", beforeB)).toEqual("A");
        expect(editable.getAtTime("hello", beforeC)).toEqual("B");
    });
});

test("Can get last tx ID for a key", () => {
    const agentCredential = newRandomAgentCredential();
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const multilog = node.createMultiLog({
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
    });

    const content = multilog.getCurrentContent();

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.type).toEqual("comap");

    content.edit((editable) => {
        expect(editable.getLastTxID("hello")).toEqual(undefined);
        editable.set("hello", "A");
        const sessionID = editable.getLastTxID("hello")?.sessionID
        expect(sessionID && agentIDfromSessionID(sessionID)).toEqual(getAgentID(getAgent(agentCredential)));
        expect(editable.getLastTxID("hello")?.txIndex).toEqual(0);
        editable.set("hello", "B");
        expect(editable.getLastTxID("hello")?.txIndex).toEqual(1);
        editable.set("hello", "C");
        expect(editable.getLastTxID("hello")?.txIndex).toEqual(2);
    });
})