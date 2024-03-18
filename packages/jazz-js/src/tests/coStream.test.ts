import { expect, describe, test, beforeEach, Test } from "vitest";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { Co, S, SimpleAccount, jazzReady } from "..";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoStream operations", async () => {
    const me = await SimpleAccount.create({
        name: "Hermes Puggington",
    });

    class TestStream extends Co.stream<TestStream>()(S.string) {}

    const stream = new TestStream([], { owner: me });

    test("Construction", () => {
        expect(stream.by[me.co.id]?.latest).toBeUndefined();
        expect(stream.by[me.co.id]?.all).toBeUndefined();
    });
})