import { expect, test } from "vitest";
import { LocalNode } from "cojson";
import { getAgentID, newRandomAgentSecret } from "cojson/src/crypto";
import { newRandomSessionID } from "cojson/src/coValue";
import { AnonymousControlledAccount } from "cojson/src/account";
import { IDBStorage } from ".";

test.skip("Should be able to initialize and load from empty DB", async () => {
    const agentSecret = newRandomAgentSecret();

    const node = new LocalNode(
        new AnonymousControlledAccount(agentSecret),
        newRandomSessionID(getAgentID(agentSecret))
    );

    await IDBStorage.connectTo(node, { trace: true });

    console.log("yay!");

    const _team = node.createTeam();

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(node.sync.peers["storage"]).toBeDefined();
});

test("Should be able to sync data to database and then load that from a new node", async () => {
    const agentSecret = newRandomAgentSecret();

    const node1 = new LocalNode(
        new AnonymousControlledAccount(agentSecret),
        newRandomSessionID(getAgentID(agentSecret))
    );

    await IDBStorage.connectTo(node1, { trace: true, localNodeName: "node1" });

    console.log("yay!");

    const team = node1.createTeam();

    const map = team.createMap();

    map.edit((m) => {
        m.set("hello", "world");
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const node2 = new LocalNode(
        new AnonymousControlledAccount(agentSecret),
        newRandomSessionID(getAgentID(agentSecret))
    );

    await IDBStorage.connectTo(node2, { trace: true, localNodeName: "node2" });

    const map2 = await node2.load(map.id);

    expect(map2.get("hello")).toBe("world");
});
