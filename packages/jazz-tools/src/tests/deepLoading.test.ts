const Crypto = await WasmCrypto.create();
import { connectedPeers } from "cojson/src/streamUtils.ts";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
  Account,
  CoFeed,
  CoList,
  CoMap,
  ID,
  Profile,
  SessionID,
  WasmCrypto,
  co,
  createJazzContext,
  fixedCredentialsAuth,
  isControlledAccount,
} from "../index.web.js";
import {
  Clean,
  DeeplyLoaded,
  UnCo,
  randomSessionProvider,
} from "../internal.js";

class TestMap extends CoMap {
  list = co.ref(TestList);
  optionalRef = co.ref(InnermostMap, { optional: true });
}

class TestList extends CoList.Of(co.ref(() => InnerMap)) {}

class InnerMap extends CoMap {
  stream = co.ref(TestStream);
}

class TestStream extends CoFeed.Of(co.ref(() => InnermostMap)) {}

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

  if (!isControlledAccount(me)) {
    throw "me is not a controlled account";
  }
  me._raw.core.node.syncManager.addPeer(secondPeer);
  const { account: meOnSecondPeer } = await createJazzContext({
    auth: fixedCredentialsAuth({
      accountID: me.id,
      secret: me._raw.agentSecret,
    }),
    sessionProvider: randomSessionProvider,
    peersToLoadFrom: [initialAsPeer],
    crypto: Crypto,
  });

  test("loading a deeply nested object will wait until all required refs are loaded", async () => {
    const ownership = { owner: me };
    const map = TestMap.create(
      {
        list: TestList.create(
          [
            InnerMap.create(
              {
                stream: TestStream.create(
                  [InnermostMap.create({ value: "hello" }, ownership)],
                  ownership,
                ),
              },
              ownership,
            ),
          ],
          ownership,
        ),
      },
      ownership,
    );

    const map1 = await TestMap.load(map.id, meOnSecondPeer);
    expectTypeOf(map1).toEqualTypeOf<TestMap | undefined>();
    if (map1 === undefined) {
      throw new Error("map1 is undefined");
    }
    expect(map1.list).toBe(null);

    const map2 = await TestMap.load(map.id, meOnSecondPeer, {
      resolve: { list: true },
    });
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

    const map3 = await TestMap.load(map.id, meOnSecondPeer, {
      resolve: { list: { items: true } },
    });
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

    const map3a = await TestMap.load(map.id, meOnSecondPeer, {
      resolve: { optionalRef: true } as const,
    });
    expectTypeOf(map3a).toEqualTypeOf<
      | (TestMap & {
          optionalRef: InnermostMap | undefined;
        })
      | undefined
    >();

    const map4 = await TestMap.load(map.id, meOnSecondPeer, {
      resolve: { list: { items: { stream: true } } },
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
    expect(map4.list[0]?.stream?.[me.id]).not.toBe(null);
    expect(map4.list[0]?.stream?.byMe?.value).toBe(null);

    const map5 = await TestMap.load(map.id, meOnSecondPeer, {
      resolve: { list: { items: { stream: { items: true } } } },
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

  async migrate(
    this: CustomAccount,
    creationProps?: { name: string } | undefined,
  ) {
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

    const thisLoaded = await this.ensureLoaded({
      resolve: {
        profile: { stream: true },
        root: { list: true },
      },
    });
    expectTypeOf(thisLoaded).toEqualTypeOf<
      | (CustomAccount & {
          profile: CustomProfile & {
            stream: TestStream;
          };
          root: TestMap & {
            list: TestList;
          };
        })
      | undefined
    >();
  }
}

test("Deep loading within account", async () => {
  const me = await CustomAccount.create({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });

  const meLoaded = await me.ensureLoaded({
    resolve: {
      profile: { stream: true },
      root: { list: true },
    },
  });
  expectTypeOf(meLoaded).toEqualTypeOf<
    | (CustomAccount & {
        profile: CustomProfile & {
          stream: TestStream;
        };
        root: TestMap & {
          list: TestList;
        };
      })
    | undefined
  >();
  if (meLoaded === undefined) {
    throw new Error("meLoaded is undefined");
  }
  expect(meLoaded.profile.stream).not.toBe(null);
  expect(meLoaded.root.list).not.toBe(null);
});

class RecordLike extends CoMap.Record(co.ref(TestMap)) {}

test("Deep loading a record-like coMap", async () => {
  const me = await Account.create({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });

  const [initialAsPeer, secondPeer] = connectedPeers("initial", "second", {
    peer1role: "server",
    peer2role: "client",
  });

  if (!isControlledAccount(me)) {
    throw "me is not a controlled account";
  }

  me._raw.core.node.syncManager.addPeer(secondPeer);
  const { account: meOnSecondPeer } = await createJazzContext({
    auth: fixedCredentialsAuth({
      accountID: me.id,
      secret: me._raw.agentSecret,
    }),
    sessionProvider: randomSessionProvider,
    peersToLoadFrom: [initialAsPeer],
    crypto: Crypto,
  });

  const record = RecordLike.create(
    {
      key1: TestMap.create(
        { list: TestList.create([], { owner: me }) },
        { owner: me },
      ),
      key2: TestMap.create(
        { list: TestList.create([], { owner: me }) },
        { owner: me },
      ),
    },
    { owner: me },
  );

  const recordLoaded = await RecordLike.load(record.id, meOnSecondPeer, {
    resolve: {
      items: { list: { items: true } },
    },
  });
  expectTypeOf(recordLoaded).toEqualTypeOf<
    | (RecordLike & {
        [key: string]: TestMap & {
          list: TestList & InnerMap[];
        };
      })
    | undefined
  >();
  if (recordLoaded === undefined) {
    throw new Error("recordLoaded is undefined");
  }
  expect(recordLoaded.key1?.list).not.toBe(null);
  expect(recordLoaded.key1?.list).not.toBe(undefined);
  expect(recordLoaded.key2?.list).not.toBe(null);
  expect(recordLoaded.key2?.list).not.toBe(undefined);
});
