import "fake-indexeddb/auto"; // Polyfill for IndexedDB

import { ControlledAgent, LocalNode, WasmCrypto } from "cojson";
import { expect, test } from "vitest";
import { IDBStorage } from "../index.js";

const Crypto = await WasmCrypto.create();

test("Should be able to initialize and load from empty DB", async () => {
  const agentSecret = Crypto.newRandomAgentSecret();

  const node = new LocalNode(
    new ControlledAgent(agentSecret, Crypto),
    Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret)),
    Crypto,
  );

  node.syncManager.addPeer(await IDBStorage.asPeer({}));

  await new Promise((resolve) => setTimeout(resolve, 200));

  expect(node.syncManager.peers.indexedDB).toBeDefined();
});

test("Should be able to sync data to database and then load that from a new node", async () => {
  const agentSecret = Crypto.newRandomAgentSecret();

  const node1 = new LocalNode(
    new ControlledAgent(agentSecret, Crypto),
    Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret)),
    Crypto,
  );

  node1.syncManager.addPeer(
    await IDBStorage.asPeer({ localNodeName: "node1" }),
  );

  const group = node1.createGroup();

  const map = group.createMap();

  map.set("hello", "world");

  await new Promise((resolve) => setTimeout(resolve, 200));

  const node2 = new LocalNode(
    new ControlledAgent(agentSecret, Crypto),
    Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret)),
    Crypto,
  );

  node2.syncManager.addPeer(
    await IDBStorage.asPeer({ localNodeName: "node2" }),
  );

  const map2 = await node2.load(map.id);
  if (map2 === "unavailable") {
    throw new Error("Map is unavailable");
  }

  expect(map2.get("hello")).toBe("world");
});
