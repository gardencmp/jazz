import { expect, test, beforeEach } from "vitest";
import { newRandomSessionID } from "../coValueCore.js";
import { cojsonReady } from "../index.js";
import { LocalNode } from "../localNode.js";
import { connectedPeers } from "../streamUtils.js";

import { webcrypto } from "node:crypto";
if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await cojsonReady;
});

test("Can create a node while creating a new account with profile", async () => {
    const { node, accountID, accountSecret, sessionID } =
        await LocalNode.withNewlyCreatedAccount({
            creationProps: { name: "Hermes Puggington" },
        });

    expect(node).not.toBeNull();
    expect(accountID).not.toBeNull();
    expect(accountSecret).not.toBeNull();
    expect(sessionID).not.toBeNull();

    expect(node.expectProfileLoaded(accountID).get("name")).toEqual(
        "Hermes Puggington"
    );
});

test("A node with an account can create groups and and objects within them", async () => {
    const { node, accountID } = await LocalNode.withNewlyCreatedAccount({
        creationProps: { name: "Hermes Puggington" },
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
        });

    const group = await node.createGroup();
    expect(group).not.toBeNull();

    const map = group.createMap();
    map.set("foo", "bar", "private");
    expect(map.get("foo")).toEqual("bar");

    const [node1asPeer, node2asPeer] = connectedPeers("node1", "node2", {
        trace: true,
        peer1role: "server",
        peer2role: "client",
    });

    node.syncManager.addPeer(node2asPeer);

    const node2 = await LocalNode.withLoadedAccount({
        accountID,
        accountSecret,
        sessionID: newRandomSessionID(accountID),
        peersToLoadFrom: [node1asPeer],
    });

    const map2 = await node2.load(map.id);
    if (map2 === "unavailable") throw new Error("Map unavailable");

    expect(map2.get("foo")).toEqual("bar");
});
