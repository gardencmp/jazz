import { expect, describe, test, beforeEach } from "vitest";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { Co, S, SimpleAccount, jazzReady } from "..";
import { rawCoValueSym } from "../coValueInterfaces";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoMap operations", async () => {
    const me = await SimpleAccount.create({
        name: "Hermes Puggington",
    });

    class TestMap extends Co.map({
        color: S.string,
        height: S.number,
        birthday: S.Date
    }) {}

    const birthday = new Date();

    const map = new TestMap(me, {
        color: "red",
        height: 10,
        birthday: birthday
    });

    test("Construction", () => {
        expect(map.color).toEqual("red");
        expect(map.height).toEqual(10);
        expect(map.birthday).toEqual(birthday);
        expect(map[rawCoValueSym].get("birthday")).toEqual(birthday.toISOString());
    });

    describe("Mutation", () => {
        test("assignment", () => {
            map.color = "blue";
            expect(map.color).toEqual("blue");
            expect(map[rawCoValueSym].get("color")).toEqual("blue");
            const newBirthday = new Date();
            map.birthday = newBirthday;
            expect(map.birthday).toEqual(newBirthday);
            expect(map[rawCoValueSym].get("birthday")).toEqual(newBirthday.toISOString());
        });
    });
});

describe("CoMap resolution", async () => {
    class TwiceNestedMap extends Co.map({
        taste: S.string,
    }) {}

    class NestedMap extends Co.map({
        name: S.string,
        twiceNested: TwiceNestedMap,
    }) {}

    class TestMap extends Co.map({
        color: S.string,
        height: S.number,
        nested: NestedMap,
    }) {}

    const initNodeAndMap = async () => {
        const me = await SimpleAccount.create({
            name: "Hermes Puggington",
        });

        const map = new TestMap(me, {
            color: "red",
            height: 10,
            nested: new NestedMap(me, {
                name: "nested",
                twiceNested: new TwiceNestedMap(me, { taste: "sour" }),
            }),
        });

        return { me, map };
    };

    test("Construction", async () => {
        const { map } = await initNodeAndMap();
        expect(map.color).toEqual("red");
        expect(map.height).toEqual(10);
        expect(map.nested?.name).toEqual("nested");
        expect(map.nested?.id).toBeDefined();
        expect(map.nested?.twiceNested?.taste).toEqual("sour");
    });

    test("Loading and availability", async () => {
        const { me, map } = await initNodeAndMap();
        const [initialAsPeer, secondPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );
        me[rawCoValueSym].core.node.syncManager.addPeer(secondPeer);
        const meOnSecondPeer = await SimpleAccount.load({
            accountID: me.id,
            accountSecret: me[rawCoValueSym].agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        const loadedMap = await TestMap.load(map.id, { as: meOnSecondPeer });

        expect(loadedMap?.color).toEqual("red");
        expect(loadedMap?.height).toEqual(10);
        expect(loadedMap?.nested).toEqual(undefined);
        expect(loadedMap?.meta.refs.nested?.id).toEqual(map.nested?.id);
        expect(loadedMap?.meta.refs.nested?.loaded).toEqual(false);

        const loadedNestedMap = await NestedMap.load(map.nested!.id, {
            as: meOnSecondPeer,
        });

        expect(loadedMap?.nested?.name).toEqual("nested");
        expect(loadedMap?.meta.refs.nested?.loaded).toEqual(true);
        expect(loadedMap?.meta.refs.nested?.value).toEqual(loadedNestedMap);
        expect(loadedMap?.nested?.twiceNested?.taste).toEqual(undefined);

        const loadedTwiceNestedMap = await TwiceNestedMap.load(
            map.nested!.twiceNested!.id,
            { as: meOnSecondPeer }
        );

        expect(loadedMap?.nested?.twiceNested?.taste).toEqual("sour");
        expect(loadedMap?.nested?.meta.refs.twiceNested?.value).toEqual(
            loadedTwiceNestedMap
        );

        const otherNestedMap = new NestedMap(meOnSecondPeer, {
            name: "otherNested",
            twiceNested: new TwiceNestedMap(meOnSecondPeer, { taste: "sweet" }),
        });

        loadedMap!.nested = otherNestedMap;
        expect(loadedMap?.nested?.name).toEqual("otherNested");
        expect(loadedMap?.meta.refs.nested?.loaded).toEqual(true);
        expect(loadedMap?.meta.refs.nested?.id).toEqual(otherNestedMap.id);
        expect(loadedMap?.meta.refs.nested?.value).toEqual(otherNestedMap);
        expect(loadedMap?.nested?.twiceNested?.taste).toEqual("sweet");
        expect(loadedMap?.nested?.meta.refs.twiceNested?.loaded).toEqual(true);
    });
});