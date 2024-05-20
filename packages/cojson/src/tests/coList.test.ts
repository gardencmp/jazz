import { expect, test, beforeEach } from "vitest";
import { expectList, expectMap, expectStream } from "../coValue.js";
import { RawBinaryCoStream } from "../coValues/coStream.js";
import { MAX_RECOMMENDED_TX_SIZE, WasmCrypto } from "../index.js";
import { LocalNode } from "../localNode.js";
import { accountOrAgentIDfromSessionID } from "../typeUtils/accountOrAgentIDfromSessionID.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";

const Crypto = await WasmCrypto.create();

test("Empty CoList works", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
    });

    const content = expectList(coValue.getCurrentContent());

    expect(content.type).toEqual("colist");
    expect(content.toJSON()).toEqual([]);
});

test("Can append, prepend, delete and replace items in CoList", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
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
    content.replace(2, "universe", "trusting");
    expect(content.toJSON()).toEqual(["hello", "beautiful", "universe", "hooray"]);
    content.delete(2, "trusting");
    expect(content.toJSON()).toEqual(["hello", "beautiful", "hooray"]);
});

test("Push is equivalent to append after last item", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
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
    const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

    const coValue = node.createCoValue({
        type: "colist",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
    });

    const content = expectList(coValue.getCurrentContent());

    expect(content.type).toEqual("colist");

    content.append("hello", undefined, "trusting");
    expect(content.toJSON()).toEqual(["hello"]);
});