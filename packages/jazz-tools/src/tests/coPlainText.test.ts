import { describe, expect, test } from "vitest";
import {
  createJazzContext,
  Account,
  CoPlainText,
  WasmCrypto,
  fixedCredentialsAuth,
  cojsonInternals,
  isControlledAccount,
} from "../index.web.js";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { randomSessionProvider } from "../internal.js";

const Crypto = await WasmCrypto.create();

describe("CoPlainText", () => {
  const initNodeAndText = async () => {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    const text = CoPlainText.create("hello world", { owner: me });

    return { me, text };
  };

  describe("Simple CoPlainText operations", async () => {
    const { me, text } = await initNodeAndText();

    test("Construction", () => {
      expect(text + "").toEqual("hello world");
    });

    describe("Mutation", () => {
      test("insertion", () => {
        const text = CoPlainText.create("hello world", { owner: me });

        text.insertAfter(5, " cruel");
        expect(text + "").toEqual("hello cruel world");
      });

      test("deletion", () => {
        const text = CoPlainText.create("hello world", { owner: me });

        text.deleteRange({ from: 3, to: 8 });
        expect(text + "").toEqual("helrld");
      });
    });

    describe("Position operations", () => {
      test("idxBefore returns index before a position", () => {
        const text = CoPlainText.create("hello world", { owner: me });

        // Get position at index 5 (between "hello" and " world")
        const pos = text.posBefore(5);
        expect(pos).toBeDefined();

        // Verify idxBefore returns the index before the position (4)
        // This makes sense as the position is between characters,
        // and idxBefore returns the index of the last character before that position
        const idx = text.idxBefore(pos!);
        expect(idx).toBe(4); // Index of 'o' in "hello"
      });

      test("idxAfter returns index after a position", () => {
        const text = CoPlainText.create("hello world", { owner: me });

        // Get position at index 5 (between "hello" and " world")
        const pos = text.posBefore(5);
        expect(pos).toBeDefined();

        // Verify idxAfter returns the index after the position (5)
        // This makes sense as the position is between characters,
        // and idxAfter returns the index of the first character after that position
        const idx = text.idxAfter(pos!);
        expect(idx).toBe(5); // Index of ' ' in "hello world"
      });
    });
  });

  describe("Loading and availability", () => {
    test("can load text across peers", async () => {
      const { me, text } = await initNodeAndText();
      const id = text.id;

      // Set up peer connections
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

      // Load the text on the second peer
      const loaded = await CoPlainText.load(id, meOnSecondPeer);
      expect(loaded).toBeDefined();
      expect(loaded!.toString()).toBe("hello world");
    });
  });

  test("Subscription & auto-resolution", async () => {
    const { me, text } = await initNodeAndText();

    // Set up peer connections
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

    const queue = new cojsonInternals.Channel();

    // Subscribe to text updates
    CoPlainText.subscribe(text.id, meOnSecondPeer, (subscribedText) => {
      console.log("subscribedText", subscribedText.toString());
      void queue.push(subscribedText);
    });

    // Initial subscription should give us the text
    const update1 = (await queue.next()).value;
    expect(update1.toString()).toBe("hello world");

    // When we make a change, we should get an update
    text.insertAfter(5, " beautiful");
    const update2 = (await queue.next()).value;
    expect(update2.toString()).toBe("hello beautiful world");

    // When we make another change, we should get another update
    update2.deleteRange({ from: 5, to: 15 }); // Delete " beautiful"
    const update3 = (await queue.next()).value;
    expect(update3.toString()).toBe("hello world");
  });
});
