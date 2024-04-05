import { Account, Co, ImageDefinition, S, jazzReady } from "..";
import { describe, test, beforeEach, expectTypeOf } from "vitest";
import { ValueRef } from "../refs";
import { webcrypto } from "node:crypto";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

class TestMap extends Co.map({
    name: S.string,
    image: Co.media.imageDef,
    maybeImage: S.optional(Co.media.imageDef),
}).as<TestMap>() {}

describe("CoMap type tests", () => {
    test("Optional field refs work", async () => {
        const me = await Account.create({
            name: "Hermes Puggington",
        });

        const map = new TestMap({
            name: "Hermes",
            image: new ImageDefinition({
                originalSize: [100, 100],
                placeholderDataURL: "data:image/png;base64,",
            }, { owner: me }),
        }, {owner: me});
        expectTypeOf(map._refs.image).toMatchTypeOf<ValueRef<ImageDefinition>>();
        expectTypeOf(map._refs.maybeImage).toMatchTypeOf<ValueRef<ImageDefinition>>();
    })
})