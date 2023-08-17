import { expect, test } from "vitest";
import { AnonymousControlledAccount, LocalNode, cojsonInternals } from "cojson";
import { IDBStorage } from ".";

test.skip("Should be able to initialize and load from empty DB", async () => {
    const agentSecret = cojsonInternals.newRandomAgentSecret();

    const node = new LocalNode(
        new AnonymousControlledAccount(agentSecret),
        cojsonInternals.newRandomSessionID(
            cojsonInternals.getAgentID(agentSecret)
        )
    );

    node.sync.addPeer(await IDBStorage.asPeer({ trace: true }));

    console.log("yay!");

    const _team = node.createTeam();

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(node.sync.peers["storage"]).toBeDefined();
});

test("Should be able to sync data to database and then load that from a new node", async () => {
    const agentSecret = cojsonInternals.newRandomAgentSecret();

    const node1 = new LocalNode(
        new AnonymousControlledAccount(agentSecret),
        cojsonInternals.newRandomSessionID(
            cojsonInternals.getAgentID(agentSecret)
        )
    );

    node1.sync.addPeer(
        await IDBStorage.asPeer({ trace: true, localNodeName: "node1" })
    );

    console.log("yay!");

    const team = node1.createTeam();

    const map = team.createMap();

    map.edit((m) => {
        m.set("hello", "world");
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const node2 = new LocalNode(
        new AnonymousControlledAccount(agentSecret),
        cojsonInternals.newRandomSessionID(
            cojsonInternals.getAgentID(agentSecret)
        )
    );

    node2.sync.addPeer(
        await IDBStorage.asPeer({ trace: true, localNodeName: "node2" })
    );

    const map2 = await node2.load(map.id);

    expect(map2.get("hello")).toBe("world");
});
