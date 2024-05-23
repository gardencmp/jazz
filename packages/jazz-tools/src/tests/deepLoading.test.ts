const Crypto = await WasmCrypto.create();
import { expect, describe, test, expectTypeOf } from "vitest";
import { connectedPeers } from "cojson/src/streamUtils.js";
import {
    Account,
    CoList,
    CoMap,
    CoStream,
    SessionID,
    WasmCrypto,
    co,
    Profile,
} from "../index.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { ID, Me } from "../internal.js";

class TestMap extends CoMap {
    list = co.ref(TestList);
}

class TestList extends CoList.Of(co.ref(() => InnerMap)) {}

class InnerMap extends CoMap {
    stream = co.ref(TestStream);
}

class TestStream extends CoStream.Of(co.ref(() => InnermostMap)) {}

class InnermostMap extends CoMap {
    value = co.string;
}

describe("Deep loading with depth arg", async () => {
    const me = await Account.create({
        creationProps: { name: "Hermes Puggington" },
        crypto: Crypto,
    });

    const [initialAsPeer, secondPeer] = connectedPeers("initial", "second", {
        peer1role: "server",
        peer2role: "client",
    });
    me._raw.core.node.syncManager.addPeer(secondPeer);
    const meOnSecondPeer = await Account.become({
        accountID: me.id,
        accountSecret: me._raw.agentSecret,
        peersToLoadFrom: [initialAsPeer],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sessionID: newRandomSessionID(me.id as any),
        crypto: Crypto,
    });

    test("loading a deeply nested object will wait until all required refs are loaded", async () => {
        const map = TestMap.create(
            {
                list: TestList.create(
                    [
                        InnerMap.create(
                            {
                                stream: TestStream.create(
                                    [
                                        InnermostMap.create(
                                            { value: "hello" },
                                            { owner: me },
                                        ),
                                    ],
                                    { owner: me },
                                ),
                            },
                            { owner: me },
                        ),
                    ],
                    { owner: me },
                ),
            },
            { owner: me },
        );

        const map1 = await TestMap.load(map.id, meOnSecondPeer, {});
        expectTypeOf(map1).toEqualTypeOf<TestMap | undefined>();
        if (map1 === undefined) {
            throw new Error("map1 is undefined");
        }
        expect(map1.list).toBe(null);

        const map2 = await TestMap.load(map.id, meOnSecondPeer, { list: [] });
        expectTypeOf(map2).toEqualTypeOf<
            | (TestMap & {
                  list: TestList;
              })
            | undefined
        >();
        if (map2 === undefined) {
            throw new Error("map2 is undefined");
        }
        expect(map2.list).not.toBe(null);
        expect(map2.list[0]).toBe(null);

        const map3 = await TestMap.load(map.id, meOnSecondPeer, { list: [{}] });
        expectTypeOf(map3).toEqualTypeOf<
            | (TestMap & {
                  list: TestList & InnerMap[];
              })
            | undefined
        >();
        if (map3 === undefined) {
            throw new Error("map3 is undefined");
        }
        expect(map3.list[0]).not.toBe(null);
        expect(map3.list[0]?.stream).toBe(null);

        const map4 = await TestMap.load(map.id, meOnSecondPeer, {
            list: [{ stream: [] }],
        });
        expectTypeOf(map4).toEqualTypeOf<
            | (TestMap & {
                  list: TestList & (InnerMap & { stream: TestStream })[];
              })
            | undefined
        >();
        if (map4 === undefined) {
            throw new Error("map4 is undefined");
        }
        expect(map4.list[0]?.stream).not.toBe(null);
        expect(map4.list[0]?.stream?.[me.id]?.value).toBe(null);
        expect(map4.list[0]?.stream?.byMe?.value).toBe(null);

        const map5 = await TestMap.load(map.id, meOnSecondPeer, {
            list: [{ stream: [{}] }],
        });
        type ExpectedMap5 =
            | (TestMap & {
                  list: TestList &
                      (InnerMap & {
                          stream: TestStream & {
                              byMe?: { value: InnermostMap };
                              inCurrentSession?: { value: InnermostMap };
                              perSession: {
                                  [sessionID: SessionID]: {
                                      value: InnermostMap;
                                  };
                              };
                          } & {
                              [key: ID<Account>]: { value: InnermostMap };
                          };
                      })[];
              })
            | undefined;

        expectTypeOf(map5).toEqualTypeOf<ExpectedMap5>();
        if (map5 === undefined) {
            throw new Error("map5 is undefined");
        }
        expect(map5.list[0]?.stream?.[me.id]?.value).not.toBe(null);
        expect(map5.list[0]?.stream?.byMe?.value).not.toBe(null);
    });
});

class CustomProfile extends Profile {
    stream = co.ref(TestStream);
}

class CustomAccount extends Account {
    profile = co.ref(CustomProfile);
    root = co.ref(TestMap);

    migrate(
        creationProps?: { name: string } | undefined,
    ): void | Promise<void> {
        if (creationProps) {
            this.profile = CustomProfile.create(
                {
                    name: creationProps.name,
                    stream: TestStream.create([], { owner: this }),
                },
                { owner: this },
            );
            this.root = TestMap.create(
                { list: TestList.create([], { owner: this }) },
                { owner: this },
            );
        }
    }
}

test("Deep loading within account", async () => {
    const me = await CustomAccount.create({
        creationProps: { name: "Hermes Puggington" },
        crypto: Crypto,
    });

    const meLoaded = await me.load({profile: {stream: []}, root: {list: []}});
    expectTypeOf(meLoaded).toEqualTypeOf<CustomAccount & Me & {
        profile: CustomProfile & {
            stream: TestStream;
        };
        root: TestMap & {
            list: TestList;
        };
    } | undefined>();
    if (meLoaded === undefined) {
        throw new Error("meLoaded is undefined");
    }
    expect(meLoaded.profile.stream).not.toBe(null);
    expect(meLoaded.root.list).not.toBe(null);
});
