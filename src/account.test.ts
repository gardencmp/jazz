import { LocalNode } from "./node.js";

test("Can create a node while creating a new account with profile", async () => {
    const { node, account, accountSecret, sessionID } =
        LocalNode.withNewlyCreatedAccount("Hermes Puggington");

    expect(node).not.toBeNull();
    expect(account).not.toBeNull();
    expect(accountSecret).not.toBeNull();
    expect(sessionID).not.toBeNull();

    expect((node.expectProfileLoaded(account)).get("name")).toEqual("Hermes Puggington");
    expect((await node.loadProfile(account)).get("name")).toEqual("Hermes Puggington");
});

test("A node with an account can create teams and and objects within them", async () => {
    const { node, account } =
        LocalNode.withNewlyCreatedAccount("Hermes Puggington");

    const team = await node.createTeam();
    expect(team).not.toBeNull();

    let map = team.createMap();
    map = map.edit((edit) => {
        edit.set("foo", "bar", "private");
        expect(edit.get("foo")).toEqual("bar");
    });

    expect(map.get("foo")).toEqual("bar");

    expect(map.getLastEditor("foo")).toEqual(account);
});