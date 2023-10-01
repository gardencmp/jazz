import { CoList, CoMap, CoStream, Group, LocalNode, cojsonReady } from "cojson";
import { autoSub } from ".";

beforeEach(async () => {
    await cojsonReady;
});

test("Queries with maps work", async () => {
    const { node, accountID } = LocalNode.withNewlyCreatedAccount({
        name: "Hermes Puggington",
    });

    const group = node.createGroup();

    let map = group.createMap<
        CoMap<{
            hello: "world";
            subMap: CoMap<{
                hello: "world" | "moon" | "sun";
                id: string;
            }>["id"];
        }>
    >();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = autoSub(map.id, node, (resolvedMap) => {
            // console.log("update", update);
            if (resolvedMap) {
                expect(resolvedMap.coValueType).toBe("comap");
                expect(resolvedMap.id).toEqual(map.id);
                expect(resolvedMap.meta.group).toBeInstanceOf(Group);
                expect(resolvedMap.meta.group.id).toBe(group.id);
                expect(resolvedMap.meta.headerMeta).toBe(null);
                expect(resolvedMap.hello).toBe("world");
                expect(Object.keys(resolvedMap)).toEqual(["hello", "subMap"]);
                if (resolvedMap.meta.edits.hello?.by?.profile?.name) {
                    expect(resolvedMap.meta.edits.hello.by.id).toEqual(
                        accountID
                    );
                    expect(resolvedMap.meta.edits.hello.by.profile.id).toEqual(
                        node.expectProfileLoaded(accountID).id
                    );
                    expect(
                        resolvedMap.meta.edits.hello.by.profile.name
                    ).toEqual("Hermes Puggington");
                    expect(resolvedMap.meta.edits.hello.by.isMe).toBe(true);
                    expect(resolvedMap.meta.edits.hello.tx).toEqual(
                        map.lastEditAt("hello")!.tx
                    );
                    expect(resolvedMap.meta.edits.hello.at).toEqual(
                        new Date(map.lastEditAt("hello")!.at)
                    );
                    if (resolvedMap.subMap) {
                        expect(resolvedMap.subMap.coValueType).toBe("comap");
                        expect(resolvedMap.subMap.id).toEqual("foreignID");
                        expect(resolvedMap.subMap.meta.group).toBeInstanceOf(
                            Group
                        );
                        expect(resolvedMap.subMap.meta.group.id).toBe(group.id);
                        expect(resolvedMap.subMap.meta.headerMeta).toBe(null);
                        if (resolvedMap.subMap.hello === "moon") {
                            // console.log("got to 'moon'");
                            resolvedMap.subMap.set("hello", "sun");
                        } else if (
                            resolvedMap.subMap.hello === "sun" &&
                            resolvedMap.subMap.meta.edits.hello?.by?.profile
                                ?.name === "Hermes Puggington"
                        ) {
                            // console.log("final update", resolvedMap);
                            resolve();
                            unsubQuery();
                        }
                    }
                }
            }
        });
    });

    map = map.set("hello", "world");

    let subMap = group.createMap<
        CoMap<{
            hello: "world" | "moon" | "sun";
            id: string;
        }>
    >();

    map = map.set("subMap", subMap.id);

    subMap = subMap.mutate((subMap) => {
        subMap.set("hello", "world");
        subMap.set("id", "foreignID");
    });

    subMap = subMap.set("hello", "moon");

    await done;
});

test("Queries with lists work", () => {
    const { node, accountID } = LocalNode.withNewlyCreatedAccount({
        name: "Hermes Puggington",
    });

    const group = node.createGroup();

    let list = group.createList<CoList<string>>();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = autoSub(list.id, node, (resolvedList) => {
            if (resolvedList) {
                // console.log("update", resolvedList, resolvedList.meta.edits);
                expect(resolvedList.coValueType).toBe("colist");
                expect(resolvedList.id).toEqual(list.id);
                expect(resolvedList.meta.group).toBeInstanceOf(Group);
                expect(resolvedList.meta.group.id).toBe(group.id);
                expect(resolvedList.meta.headerMeta).toBe(null);
                expect(resolvedList[0]).toBe("hello");
                expect(resolvedList[1]).toBe("world");
                expect(resolvedList[2]).toBe("moon");
                if (resolvedList.meta.edits[2]?.by?.profile?.name) {
                    expect(resolvedList.meta.edits[2].by.id).toEqual(accountID);
                    expect(resolvedList.meta.edits[2].by.profile.id).toEqual(
                        node.expectProfileLoaded(accountID).id
                    );
                    expect(resolvedList.meta.edits[2].by.profile.name).toEqual(
                        "Hermes Puggington"
                    );
                    expect(resolvedList.meta.edits[2].by.isMe).toBe(true);
                    expect(resolvedList.meta.edits[2].at).toBeInstanceOf(Date);
                    if (resolvedList.length === 3) {
                        resolvedList.append("sun");
                    } else if (
                        resolvedList.length === 4 &&
                        resolvedList.meta.edits[3]?.by?.profile?.name ===
                            "Hermes Puggington"
                    ) {
                        expect(resolvedList[3]).toBe("sun");
                        // console.log("final update", resolvedList);
                        resolve();
                        unsubQuery();
                    }
                }
            }
        });
    });

    list = list.mutate((list) => {
        list.append("hello");
        list.append("world");
        list.append("moon");
    });

    return done;
});

test("List of nested maps works", () => {
    const { node } = LocalNode.withNewlyCreatedAccount({
        name: "Hermes Puggington",
    });

    const group = node.createGroup();

    let list = group.createList<CoList<CoMap<{ hello: "world" }>["id"]>>();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = autoSub(list.id, node, (resolvedList) => {
            if (resolvedList && resolvedList[0]) {
                // console.log("update", resolvedList);
                expect(resolvedList[0]).toMatchObject({
                    hello: "world",
                    id: list.get(0)!,
                });
                // console.log("final update", resolvedList);
                resolve();
                unsubQuery();
            }
        });
    });

    list = list.append(
        group.createMap<CoMap<{ hello: "world" }>>({
            hello: "world",
        }).id
    );

    return done;
});

test("Can call .map on a quieried coList", async () => {
    const { node } = LocalNode.withNewlyCreatedAccount({
        name: "Hermes Puggington",
    });

    const group = node.createGroup();

    let list = group.createList<CoList<string>>();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = autoSub(list.id, node, (resolvedList) => {
            if (resolvedList && resolvedList[0]) {
                // console.log("update", resolvedList);
                expect(resolvedList.map((item) => item + "!!!")).toEqual([
                    "hello!!!",
                    "world!!!",
                ]);
                // console.log("final update", resolvedList);
                resolve();
                unsubQuery();
            }
        });
    });

    list = list.mutate((list) => {
        list.append("hello");
        list.append("world");
    });

    await done;
});

test("Queries with streams work", () => {
    const { node, accountID } = LocalNode.withNewlyCreatedAccount({
        name: "Hermes Puggington",
    });

    const group = node.createGroup();

    let stream = group.createStream<CoStream<string>>();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = autoSub(stream.id, node, (resolvedStream) => {
            if (resolvedStream) {
                // console.log("update", resolvedStream);
                if (resolvedStream.me?.by?.profile?.name) {
                    expect(resolvedStream.coValueType).toBe("costream");
                    expect(resolvedStream.id).toEqual(stream.id);
                    expect(resolvedStream.meta.group).toBeInstanceOf(Group);
                    expect(resolvedStream.meta.group.id).toBe(group.id);
                    expect(resolvedStream.meta.headerMeta).toBe(null);

                    expect(
                        Object.fromEntries(resolvedStream.perSession)[
                            node.currentSessionID
                        ].last
                    ).toEqual("world");
                    expect(
                        Object.fromEntries(resolvedStream.perSession)[
                            node.currentSessionID
                        ].all[0].value
                    ).toEqual("hello");
                    expect(
                        Object.fromEntries(resolvedStream.perSession)[
                            node.currentSessionID
                        ].all[0].at
                    ).toEqual(
                        new Date(stream.items[node.currentSessionID][0].madeAt)
                    );
                    expect(
                        Object.fromEntries(resolvedStream.perSession)[
                            node.currentSessionID
                        ].all[1].value
                    ).toEqual("world");
                    expect(
                        Object.fromEntries(resolvedStream.perSession)[
                            node.currentSessionID
                        ].all[1].at
                    ).toEqual(
                        new Date(stream.items[node.currentSessionID][1].madeAt)
                    );
                    expect(
                        Object.fromEntries(resolvedStream.perSession)[
                            node.currentSessionID
                        ].by?.id
                    ).toEqual(accountID);
                    expect(
                        Object.fromEntries(resolvedStream.perSession)[
                            node.currentSessionID
                        ].by?.profile?.id
                    ).toEqual(node.expectProfileLoaded(accountID).id);
                    expect(
                        Object.fromEntries(resolvedStream.perSession)[
                            node.currentSessionID
                        ].by?.profile?.name
                    ).toEqual("Hermes Puggington");
                    expect(
                        Object.fromEntries(resolvedStream.perSession)[
                            node.currentSessionID
                        ].by?.isMe
                    ).toBe(true);
                    expect(
                        Object.fromEntries(resolvedStream.perSession)[
                            node.currentSessionID
                        ].at
                    ).toBeInstanceOf(Date);

                    expect(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                            .last
                    ).toEqual("world");
                    expect(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                            .all[0].value
                    ).toEqual("hello");
                    expect(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                            .all[0].at
                    ).toEqual(
                        new Date(stream.items[node.currentSessionID][0].madeAt)
                    );
                    expect(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                            .all[1].value
                    ).toEqual("world");
                    expect(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                            .all[1].at
                    ).toEqual(
                        new Date(stream.items[node.currentSessionID][1].madeAt)
                    );
                    expect(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                            .by?.id
                    ).toEqual(accountID);
                    expect(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                            .by?.profile?.id
                    ).toEqual(node.expectProfileLoaded(accountID).id);
                    expect(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                            .by?.profile?.name
                    ).toEqual("Hermes Puggington");
                    expect(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                            .by?.isMe
                    ).toBe(true);
                    expect(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                            .at
                    ).toBeInstanceOf(Date);

                    expect(resolvedStream.me).toEqual(
                        Object.fromEntries(resolvedStream.perAccount)[accountID]
                    );
                    // console.log("final update", resolvedStream);
                    resolve();
                    unsubQuery();
                }
            }
        });
    });

    stream = stream.push("hello");
    stream = stream.push("world");

    return done;
});

test("Streams of nested maps work", () => {
    const { node } = LocalNode.withNewlyCreatedAccount({
        name: "Hermes Puggington",
    });

    const group = node.createGroup();

    let stream =
        group.createStream<CoStream<CoMap<{ hello: "world" }>["id"]>>();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = autoSub(stream.id, node, (resolvedStream) => {
            if (resolvedStream && resolvedStream.me?.last) {
                // console.log("update", resolvedList);
                expect(resolvedStream.me.last).toMatchObject({
                    hello: "world",
                    id: map.id,
                });
                // console.log("final update", resolvedList);
                resolve();
                unsubQuery();
            }
        });
    });

    const map = group.createMap<CoMap<{ hello: "world" }>>({
        hello: "world",
    });

    stream = stream.push(map.id);

    return done;
});
