import { connectedPeers } from "cojson/src/streamUtils.ts";
import { describe, expect, test } from "vitest";
import {
  Account,
  CoFeed,
  FileStream,
  ID,
  WasmCrypto,
  co,
  cojsonInternals,
  createJazzContext,
  fixedCredentialsAuth,
  isControlledAccount,
} from "../index.web.js";
import { randomSessionProvider } from "../internal.js";
import { setupTwoNodes } from "./utils.js";

const Crypto = await WasmCrypto.create();

describe("Simple CoFeed operations", async () => {
  const me = await Account.create({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });
  if (!isControlledAccount(me)) {
    throw "me is not a controlled account";
  }
  class TestStream extends CoFeed.Of(co.string) {}

  const stream = TestStream.create(["milk"], { owner: me });

  test("Construction", () => {
    expect(stream[me.id]?.value).toEqual("milk");
    expect(stream.perSession[me.sessionID]?.value).toEqual("milk");
  });

  describe("Mutation", () => {
    test("pushing", () => {
      stream.push("bread");
      expect(stream[me.id]?.value).toEqual("bread");
      expect(stream.perSession[me.sessionID]?.value).toEqual("bread");

      stream.push("butter");
      expect(stream[me.id]?.value).toEqual("butter");
      expect(stream.perSession[me.sessionID]?.value).toEqual("butter");
    });
  });
});

describe("CoFeed resolution", async () => {
  class TwiceNestedStream extends CoFeed.Of(co.string) {
    fancyValueOf(account: ID<Account>) {
      return "Sir " + this[account]?.value;
    }
  }

  class NestedStream extends CoFeed.Of(co.ref(TwiceNestedStream)) {}

  class TestStream extends CoFeed.Of(co.ref(NestedStream)) {}

  const initNodeAndStream = async () => {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    const stream = TestStream.create(
      [
        NestedStream.create(
          [TwiceNestedStream.create(["milk"], { owner: me })],
          { owner: me },
        ),
      ],
      { owner: me },
    );

    return { me, stream };
  };

  test("Construction", async () => {
    const { me, stream } = await initNodeAndStream();
    expect(stream[me.id]?.value?.[me.id]?.value?.[me.id]?.value).toEqual(
      "milk",
    );
  });

  test("Loading and availability", async () => {
    const { me, stream } = await initNodeAndStream();
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

    const loadedStream = await TestStream.load(stream.id, meOnSecondPeer, []);

    expect(loadedStream?.[me.id]?.value).toEqual(null);
    expect(loadedStream?.[me.id]?.ref?.id).toEqual(stream[me.id]?.value?.id);

    const loadedNestedStream = await NestedStream.load(
      stream[me.id]!.value!.id,
      meOnSecondPeer,
      [],
    );

    // expect(loadedStream?.[me.id]?.value).toEqual(loadedNestedStream);
    expect(loadedStream?.[me.id]?.value?.id).toEqual(loadedNestedStream?.id);
    expect(loadedStream?.[me.id]?.value?.[me.id]?.value).toEqual(null);
    // expect(loadedStream?.[me.id]?.ref?.value).toEqual(loadedNestedStream);
    expect(loadedStream?.[me.id]?.ref?.value?.id).toEqual(
      loadedNestedStream?.id,
    );
    expect(loadedStream?.[me.id]?.value?.[me.id]?.ref?.id).toEqual(
      stream[me.id]?.value?.[me.id]?.value?.id,
    );

    const loadedTwiceNestedStream = await TwiceNestedStream.load(
      stream[me.id]!.value![me.id]!.value!.id,
      meOnSecondPeer,
      [],
    );

    // expect(loadedStream?.[me.id]?.value?.[me.id]?.value).toEqual(
    //     loadedTwiceNestedStream
    // );
    expect(loadedStream?.[me.id]?.value?.[me.id]?.value?.id).toEqual(
      loadedTwiceNestedStream?.id,
    );
    expect(
      loadedStream?.[me.id]?.value?.[me.id]?.value?.fancyValueOf(me.id),
    ).toEqual("Sir milk");
    // expect(loadedStream?.[me.id]?.ref?.value).toEqual(loadedNestedStream);
    expect(loadedStream?.[me.id]?.ref?.value?.id).toEqual(
      loadedNestedStream?.id,
    );
    expect(loadedStream?.[me.id]?.value?.[me.id]?.ref?.value?.id).toEqual(
      loadedTwiceNestedStream?.id,
    );

    const otherNestedStream = NestedStream.create(
      [TwiceNestedStream.create(["butter"], { owner: meOnSecondPeer })],
      { owner: meOnSecondPeer },
    );
    loadedStream?.push(otherNestedStream);
    // expect(loadedStream?.[me.id]?.value).toEqual(otherNestedStream);
    expect(loadedStream?.[me.id]?.value?.id).toEqual(otherNestedStream?.id);
    expect(loadedStream?.[me.id]?.ref?.value?.id).toEqual(
      otherNestedStream?.id,
    );
    expect(loadedStream?.[me.id]?.value?.[me.id]?.value?.id).toEqual(
      otherNestedStream[me.id]?.value?.id,
    );
    expect(
      loadedStream?.[me.id]?.value?.[me.id]?.value?.fancyValueOf(me.id),
    ).toEqual("Sir butter");
  });

  test("Subscription & auto-resolution", async () => {
    const { me, stream } = await initNodeAndStream();

    const [initialAsPeer, secondAsPeer] = connectedPeers("initial", "second", {
      peer1role: "server",
      peer2role: "client",
    });

    me._raw.core.node.syncManager.addPeer(secondAsPeer);
    if (!isControlledAccount(me)) {
      throw "me is not a controlled account";
    }
    const { account: meOnSecondPeer } = await createJazzContext({
      auth: fixedCredentialsAuth({
        accountID: me.id,
        secret: me._raw.agentSecret,
      }),
      sessionProvider: randomSessionProvider,
      peersToLoadFrom: [initialAsPeer],
      crypto: Crypto,
    });

    const queue = new cojsonInternals.Channel();

    TestStream.subscribe(stream.id, meOnSecondPeer, [], (subscribedStream) => {
      void queue.push(subscribedStream);
    });

    const update1 = (await queue.next()).value;
    expect(update1[me.id]?.value).toEqual(null);

    const update2 = (await queue.next()).value;
    expect(update2[me.id]?.value).toBeDefined();
    expect(update2[me.id]?.value?.[me.id]?.value).toBe(null);

    const update3 = (await queue.next()).value;
    expect(update3[me.id]?.value?.[me.id]?.value).toBeDefined();
    expect(update3[me.id]?.value?.[me.id]?.value?.[me.id]?.value).toBe("milk");

    update3[me.id]!.value![me.id]!.value!.push("bread");

    const update4 = (await queue.next()).value;
    expect(update4[me.id]?.value?.[me.id]?.value?.[me.id]?.value).toBe("bread");

    // When assigning a new nested stream, we get an update
    const newTwiceNested = TwiceNestedStream.create(["butter"], {
      owner: meOnSecondPeer,
    });

    const newNested = NestedStream.create([newTwiceNested], {
      owner: meOnSecondPeer,
    });

    update4.push(newNested);

    const update5 = (await queue.next()).value;
    expect(update5[me.id]?.value?.[me.id]?.value?.[me.id]?.value).toBe(
      "butter",
    );

    // we get updates when the new nested stream changes
    newTwiceNested.push("jam");
    const update6 = (await queue.next()).value;
    expect(update6[me.id]?.value?.[me.id]?.value?.[me.id]?.value).toBe("jam");
  });
});

describe("Simple FileStream operations", async () => {
  const me = await Account.create({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });

  const stream = FileStream.create({ owner: me });

  test("Construction", () => {
    expect(stream.getChunks()).toBe(undefined);
  });

  test("Mutation", () => {
    stream.start({ mimeType: "text/plain" });
    stream.push(new Uint8Array([1, 2, 3]));
    stream.push(new Uint8Array([4, 5, 6]));
    stream.end();

    const chunks = stream.getChunks();
    expect(chunks?.mimeType).toBe("text/plain");
    expect(chunks?.chunks).toEqual([
      new Uint8Array([1, 2, 3]),
      new Uint8Array([4, 5, 6]),
    ]);
    expect(chunks?.finished).toBe(true);
  });
});

describe("FileStream loading & Subscription", async () => {
  const initNodeAndStream = async () => {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    const stream = FileStream.create({ owner: me });

    stream.start({ mimeType: "text/plain" });
    stream.push(new Uint8Array([1, 2, 3]));
    stream.push(new Uint8Array([4, 5, 6]));
    stream.end();

    return { me, stream };
  };

  test("Construction", async () => {
    const { stream } = await initNodeAndStream();
    expect(stream.getChunks()).toEqual({
      mimeType: "text/plain",
      chunks: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
      finished: true,
    });
  });

  test("Loading and availability", async () => {
    const { me, stream } = await initNodeAndStream();
    const [initialAsPeer, secondAsPeer] = connectedPeers("initial", "second", {
      peer1role: "server",
      peer2role: "client",
    });
    if (!isControlledAccount(me)) {
      throw "me is not a controlled account";
    }
    me._raw.core.node.syncManager.addPeer(secondAsPeer);
    const { account: meOnSecondPeer } = await createJazzContext({
      auth: fixedCredentialsAuth({
        accountID: me.id,
        secret: me._raw.agentSecret,
      }),
      sessionProvider: randomSessionProvider,
      peersToLoadFrom: [initialAsPeer],
      crypto: Crypto,
    });

    const loadedStream = await FileStream.load(stream.id, meOnSecondPeer, []);

    expect(loadedStream?.getChunks()).toEqual({
      mimeType: "text/plain",
      chunks: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
      finished: true,
    });
  });

  test("Subscription", async () => {
    const { me } = await initNodeAndStream();
    const stream = FileStream.create({ owner: me });

    const [initialAsPeer, secondAsPeer] = connectedPeers("initial", "second", {
      peer1role: "server",
      peer2role: "client",
    });
    me._raw.core.node.syncManager.addPeer(secondAsPeer);
    if (!isControlledAccount(me)) {
      throw "me is not a controlled account";
    }
    const { account: meOnSecondPeer } = await createJazzContext({
      auth: fixedCredentialsAuth({
        accountID: me.id,
        secret: me._raw.agentSecret,
      }),
      sessionProvider: randomSessionProvider,
      peersToLoadFrom: [initialAsPeer],
      crypto: Crypto,
    });

    const queue = new cojsonInternals.Channel();

    FileStream.subscribe(stream.id, meOnSecondPeer, [], (subscribedStream) => {
      void queue.push(subscribedStream);
    });

    const update1 = (await queue.next()).value;
    expect(update1.getChunks()).toBe(undefined);

    stream.start({ mimeType: "text/plain" });

    const update2 = (await queue.next()).value;
    expect(update2.getChunks({ allowUnfinished: true })).toEqual({
      mimeType: "text/plain",
      fileName: undefined,
      chunks: [],
      totalSizeBytes: undefined,
      finished: false,
    });

    stream.push(new Uint8Array([1, 2, 3]));

    const update3 = (await queue.next()).value;
    expect(update3.getChunks({ allowUnfinished: true })).toEqual({
      mimeType: "text/plain",
      fileName: undefined,
      chunks: [new Uint8Array([1, 2, 3])],
      totalSizeBytes: undefined,
      finished: false,
    });

    stream.push(new Uint8Array([4, 5, 6]));

    const update4 = (await queue.next()).value;
    expect(update4.getChunks({ allowUnfinished: true })).toEqual({
      mimeType: "text/plain",
      fileName: undefined,
      chunks: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
      totalSizeBytes: undefined,
      finished: false,
    });

    stream.end();

    const update5 = (await queue.next()).value;
    expect(update5.getChunks()).toEqual({
      mimeType: "text/plain",
      fileName: undefined,
      chunks: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
      totalSizeBytes: undefined,
      finished: true,
    });
  });
});

describe("FileStream.loadAsBlob", async () => {
  async function setup() {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    const stream = FileStream.create({ owner: me });

    stream.start({ mimeType: "text/plain" });

    return { stream, me };
  }

  test("resolves only when the stream is ended", async () => {
    const { stream, me } = await setup();
    stream.push(new Uint8Array([1]));

    const promise = FileStream.loadAsBlob(stream.id, me);

    await stream.ensureLoaded([]);

    stream.push(new Uint8Array([2]));
    stream.end();

    const blob = await promise;

    // The promise resolves only when the stream is ended
    // so we get a blob with all the chunks
    expect(blob?.size).toBe(2);
  });

  test("resolves with an unfinshed blob if allowUnfinished: true", async () => {
    const { stream, me } = await setup();
    stream.push(new Uint8Array([1]));

    const promise = FileStream.loadAsBlob(stream.id, me, {
      allowUnfinished: true,
    });

    await stream.ensureLoaded([]);

    stream.push(new Uint8Array([2]));
    stream.end();

    const blob = await promise;

    // The promise resolves before the stream is ended
    // so we get a blob only with the first chunk
    expect(blob?.size).toBe(1);
  });
});

describe("waitForSync", async () => {
  test("CoFeed: should resolve when the value is uploaded", async () => {
    class TestStream extends CoFeed.Of(co.string) {}

    const { clientNode, serverNode, clientAccount } = await setupTwoNodes();

    const stream = TestStream.create(["1", "2", "3"], { owner: clientAccount });

    await stream.waitForSync({ timeout: 1000 });

    // Killing the client node so the serverNode can't load the map from it
    clientNode.gracefulShutdown();

    const loadedStream = await serverNode.load(stream._raw.id);

    expect(loadedStream).not.toBe("unavailable");
  });

  test("FileStream: should resolve when the value is uploaded", async () => {
    const { clientNode, serverNode, clientAccount } = await setupTwoNodes();

    const stream = FileStream.create({ owner: clientAccount });

    stream.start({ mimeType: "text/plain" });
    stream.push(new Uint8Array([2]));
    stream.end();

    await stream.waitForSync({ timeout: 1000 });

    // Killing the client node so the serverNode can't load the map from it
    clientNode.gracefulShutdown();

    const loadedStream = await serverNode.load(stream._raw.id);

    expect(loadedStream).not.toBe("unavailable");
  });
});
