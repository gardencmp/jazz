import { expect, test } from "vitest";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { LocalNode } from "../localNode.js";
import { connectedPeers } from "../streamUtils.js";

const Crypto = await WasmCrypto.create();

test("Can create a node while creating a new account with profile", async () => {
  const { node, accountID, accountSecret, sessionID } =
    await LocalNode.withNewlyCreatedAccount({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

  expect(node).not.toBeNull();
  expect(accountID).not.toBeNull();
  expect(accountSecret).not.toBeNull();
  expect(sessionID).not.toBeNull();

  expect(node.expectProfileLoaded(accountID).get("name")).toEqual(
    "Hermes Puggington",
  );
});

test("A node with an account can create groups and and objects within them", async () => {
  const { node, accountID } = await LocalNode.withNewlyCreatedAccount({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });

  const group = await node.createGroup();
  expect(group).not.toBeNull();

  const map = group.createMap();
  map.set("foo", "bar", "private");
  expect(map.get("foo")).toEqual("bar");
  expect(map.lastEditAt("foo")?.by).toEqual(accountID);
});

test("Can create account with one node, and then load it on another", async () => {
  const { node, accountID, accountSecret } =
    await LocalNode.withNewlyCreatedAccount({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

  const group = await node.createGroup();
  expect(group).not.toBeNull();

  const map = group.createMap();
  map.set("foo", "bar", "private");
  expect(map.get("foo")).toEqual("bar");

  const [node1asPeer, node2asPeer] = connectedPeers("node1", "node2", {
    peer1role: "server",
    peer2role: "client",
  });

  node.syncManager.addPeer(node2asPeer);

  const node2 = await LocalNode.withLoadedAccount({
    accountID,
    accountSecret,
    sessionID: Crypto.newRandomSessionID(accountID),
    peersToLoadFrom: [node1asPeer],
    crypto: Crypto,
  });

  const map2 = await node2.load(map.id);
  if (map2 === "unavailable") throw new Error("Map unavailable");

  expect(map2.get("foo")).toEqual("bar");
});

test("throws an error if the user tried to create an invite from an account", async () => {
  const { node, accountID } = await LocalNode.withNewlyCreatedAccount({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });

  const account = await node.load(accountID);
  if (account === "unavailable") throw new Error("Account unavailable");

  expect(() => account.createInvite("admin")).toThrow(
    "Cannot create invite from an account",
  );
});
