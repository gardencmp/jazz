import { expect, describe, test, beforeEach, Test } from "vitest";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { Account, Co, ID, S, SimpleAccount, jazzReady } from "..";

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

    const stream = new TestStream(["milk"], { owner: me });

    test("Construction", () => {
        expect(stream.by[me.co.id]).toBe("milk");
        expect(stream.in[me.co.sessionID]).toBe("milk");
    });

    describe("Mutation", () => {
        test("pushing", () => {
            stream.push("bread");
            expect(stream.by[me.co.id]).toBe("bread");
            expect(stream.in[me.co.sessionID]).toBe("bread");

            stream.push("butter");
            expect(stream.by[me.co.id]).toBe("butter");
            expect(stream.in[me.co.sessionID]).toBe("butter");
        })
    });
})

describe("CoStream resolution", async () => {
    class TwiceNestedStream extends Co.stream<TwiceNestedStream>()(S.string) {
        fancyValueOf(account: ID<Account>) {
            return "Sir " + this.by[account];
        }
    }

    class NestedStream extends Co.stream<NestedStream>()(TwiceNestedStream) {}

    class TestStream extends Co.stream<TestStream>()(NestedStream) {}

    const initNodeAndStream = async () => {
        const me = await SimpleAccount.create({
            name: "Hermes Puggington",
        });

        const stream = new TestStream([
            new NestedStream([new TwiceNestedStream(["milk"], { owner: me })], { owner: me })
        ], { owner: me });

        return { me, stream };
    }

    test("Construction", async () => {
        const { me, stream } = await initNodeAndStream();
        expect(stream.by[me.co.id].by[me.co.id].by[me.co.id]).toBe("milk");
    })
})