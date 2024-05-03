import { expect, test, beforeEach } from "vitest";
import { expectList, expectMap, expectPlainText, expectStream } from "../coValue.js";
import { RawBinaryCoStream } from "../coValues/coStream.js";
import { createdNowUnique } from "../crypto.js";
import { MAX_RECOMMENDED_TX_SIZE, cojsonReady } from "../index.js";
import { LocalNode } from "../localNode.js";
import { accountOrAgentIDfromSessionID } from "../typeUtils/accountOrAgentIDfromSessionID.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";

import { webcrypto } from "node:crypto";
if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await cojsonReady;
});

test("Empty CoPlainText works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "coplaintext",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectPlainText(coValue.getCurrentContent());

    expect(content.type).toEqual("coplaintext");
    expect(content.toString()).toEqual("");
});

test("Can insert into empty CoPlainText", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "coplaintext",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectPlainText(coValue.getCurrentContent());

    expect(content.type).toEqual("coplaintext");

    content.insertAfter(0, "a", "trusting");
    expect(content.toString()).toEqual("a");
});

test("Can insert and delete in CoPlainText", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const coValue = node.createCoValue({
        type: "coplaintext",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
    });

    const content = expectPlainText(coValue.getCurrentContent());

    expect(content.type).toEqual("coplaintext");

    content.insertAfter(0, "hello", "trusting");
    expect(content.toString()).toEqual("hello");

    content.insertAfter(5, " world", "trusting");
    expect(content.toString()).toEqual("hello world");

    content.deleteFrom(3, 5, "trusting");
    expect(content.toString()).toEqual("helrld");
})