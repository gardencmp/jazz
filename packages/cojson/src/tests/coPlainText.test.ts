import { expect, test } from "vitest";
import { expectPlainText } from "../coValue.js";
import { WasmCrypto } from "../index.js";
import { LocalNode } from "../localNode.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";

const Crypto = await WasmCrypto.create();

test("Empty CoPlainText works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "coplaintext",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
    });

    const content = expectPlainText(coValue.getCurrentContent());

    expect(content.type).toEqual("coplaintext");
    expect(content.toString()).toEqual("");
});

test("Can insert into empty CoPlainText", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "coplaintext",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
    });

    const content = expectPlainText(coValue.getCurrentContent());

    expect(content.type).toEqual("coplaintext");

    content.insertAfter(0, "a", "trusting");
    expect(content.toString()).toEqual("a");
});

test("Can insert and delete in CoPlainText", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "coplaintext",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
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