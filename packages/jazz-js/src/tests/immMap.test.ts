
import { expect, describe, test, beforeEach } from "vitest";
import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { CoMapOf, SimpleAccount, imm, jazzReady } from "..";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Primitive Immutable maps in a CoMap", async () => {
    const me = await SimpleAccount.createControlledAccount({
        name: "Hermes Puggington",
    });

    class TestMap extends CoMapOf({
        immMap: imm.map({
            color: imm.string,
            height: imm.number,
        }),
    }) {}

    const map = new TestMap(
        {
            immMap: {
                color: "red",
                height: 10,
            },
        },
        { owner: me }
    );

    test("Construction", () => {
        expect(map.immMap.color).toEqual("red");
        expect(map.immMap.height).toEqual(10);
    });
});