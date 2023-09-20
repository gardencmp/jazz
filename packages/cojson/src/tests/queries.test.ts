import { BinaryCoStream, CoList, CoMap, CoStream, Group, LocalNode, cojsonReady } from "..";

beforeEach(async () => {
    await cojsonReady;
});

test("Queries with maps work", async () => {
    const { node, accountID } =
        LocalNode.withNewlyCreatedAccount("Hermes Puggington");

    const group = node.createGroup();

    let map = group.createMap<
        CoMap<{
            hello: "world";
            subMap: CoMap<{
                hello: "world" | "moon" | "sun";
                id: string;
            }>;
        }>
    >();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = node.query(map.id, (queriedMap) => {
            // console.log("update", update);
            if (queriedMap) {
                expect(queriedMap.co.type).toBe("comap");
                expect(queriedMap.co.id).toEqual(map.id);
                expect(queriedMap.co.core).toEqual(map.core);
                expect(queriedMap.co.group).toBeInstanceOf(Group);
                expect(queriedMap.co.group.id).toBe(group.id);
                expect(queriedMap.co.meta).toBe(null);
                expect(queriedMap.hello).toBe("world");
                expect(Object.keys(queriedMap)).toEqual(["hello", "subMap"]);
                if (queriedMap.co.edits.hello?.by?.profile?.name) {
                    expect(queriedMap.co.edits.hello).toMatchObject({
                        by: {
                            id: accountID,
                            profile: {
                                id: node.expectProfileLoaded(accountID).id,
                                name: "Hermes Puggington",
                            },
                            isMe: true,
                        },
                        tx: map.lastEditAt("hello")!.tx,
                        at: new Date(map.lastEditAt("hello")!.at),
                    });
                    if (queriedMap.subMap) {
                        expect(queriedMap.subMap.co.type).toBe("comap");
                        expect(queriedMap.subMap.co.id).toEqual(subMap.id);
                        expect(queriedMap.subMap.co.core).toEqual(subMap.core);
                        expect(queriedMap.subMap.co.group).toBeInstanceOf(Group);
                        expect(queriedMap.subMap.co.group.id).toBe(group.id);
                        expect(queriedMap.subMap.co.meta).toBe(null);
                        if (queriedMap.subMap.hello === "moon") {
                            // console.log("got to 'moon'");
                            queriedMap.subMap.co.set("hello", "sun");
                        } else if (
                            queriedMap.subMap.hello === "sun" &&
                            queriedMap.subMap.co.edits.hello?.by?.profile?.name ===
                                "Hermes Puggington"
                        ) {
                            // console.log("final update", queriedMap);
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

    map = map.set("subMap", subMap);

    subMap = subMap.mutate((subMap) => {
        subMap.set("hello", "world");
        subMap.set("id", "foreignID");
    });

    subMap = subMap.set("hello", "moon");

    await done;
});

test("Queries with lists work", () => {
    const { node, accountID } =
        LocalNode.withNewlyCreatedAccount("Hermes Puggington");

    const group = node.createGroup();

    let list = group.createList<CoList<string>>();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = node.query(list.id, (queriedList) => {
            if (queriedList) {
                // console.log("update", queriedList, queriedList.edits);
                expect(queriedList.co.type).toBe("colist");
                expect(queriedList.co.id).toEqual(list.id);
                expect(queriedList.co.core).toEqual(list.core);
                expect(queriedList.co.group).toBeInstanceOf(Group);
                expect(queriedList.co.group.id).toBe(group.id);
                expect(queriedList.co.meta).toBe(null);
                expect(queriedList[0]).toBe("hello");
                expect(queriedList[1]).toBe("world");
                expect(queriedList[2]).toBe("moon");
                if (queriedList.co.edits[2]?.by?.profile?.name) {
                    expect(queriedList.co.edits[2]).toMatchObject({
                        by: {
                            id: accountID,
                            profile: {
                                id: node.expectProfileLoaded(accountID).id,
                                name: "Hermes Puggington",
                            },
                            isMe: true,
                        },
                        at: expect.any(Date),
                    });
                    if (queriedList.length === 3) {
                        queriedList.co.append("sun");

                    } else if (
                        queriedList.length === 4 &&
                        queriedList.co.edits[3]?.by?.profile?.name ===
                            "Hermes Puggington"
                    ) {
                        expect(queriedList[3]).toBe("sun");
                        // console.log("final update", queriedList);
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
    const { node } = LocalNode.withNewlyCreatedAccount("Hermes Puggington");

    const group = node.createGroup();

    let list = group.createList<CoList<CoMap<{ hello: "world" }>>>();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = node.query(list.id, (queriedList) => {
            if (queriedList && queriedList[0]) {
                // console.log("update", queriedList);
                expect(queriedList[0]).toMatchObject({
                    hello: "world",
                    id: list.get(0)!,
                });
                // console.log("final update", queriedList);
                resolve();
                unsubQuery();
            }
        });
    });

    list = list.append(
        group.createMap<CoMap<{ hello: "world" }>>({
            hello: "world",
        })
    );

    return done;
});

test("Queries with streams work", () => {
    const { node, accountID } =
        LocalNode.withNewlyCreatedAccount("Hermes Puggington");

    const group = node.createGroup();

    let stream = group.createStream<CoStream<string>>();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = node.query(stream.id, (queriedStream) => {
            if (queriedStream) {
                console.log("update", queriedStream);
                if (queriedStream.me?.by?.profile?.name) {
                    expect(queriedStream.co.type).toBe("costream");
                    expect(queriedStream.co.id).toEqual(stream.id);
                    expect(queriedStream.co.core).toEqual(stream.core);
                    expect(queriedStream.co.group).toBeInstanceOf(Group);
                    expect(queriedStream.co.group.id).toBe(group.id);
                    expect(queriedStream.co.meta).toBe(null);
                    const expectedEntry = {
                        last: "world",
                        by: {
                            id: accountID,
                            isMe: true,
                            profile: {
                                id: node.expectProfileLoaded(accountID).id,
                                name: "Hermes Puggington",
                            },
                        },
                        at: new Date(
                            stream.items[node.currentSessionID][1].madeAt
                        ),
                        all: [
                            {
                                value: "hello",
                                at: new Date(
                                    stream.items[
                                        node.currentSessionID
                                    ][0].madeAt
                                ),
                            },
                            {
                                value: "world",
                                at: new Date(
                                    stream.items[
                                        node.currentSessionID
                                    ][1].madeAt
                                ),
                            },
                        ],
                    };
                    expect(queriedStream.perSession).toMatchObject({
                        [node.currentSessionID]: expectedEntry,
                    });
                    expect(queriedStream.perAccount).toMatchObject({
                        [accountID]: expectedEntry,
                    });
                    expect(queriedStream.me).toMatchObject(expectedEntry);
                    console.log("final update", queriedStream);
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
    const { node } = LocalNode.withNewlyCreatedAccount("Hermes Puggington");

    const group = node.createGroup();

    let stream = group.createStream<CoStream<CoMap<{ hello: "world" }>>>();

    const done = new Promise<void>((resolve) => {
        const unsubQuery = node.query(stream.id, (queriedStream) => {
            if (queriedStream && queriedStream.me?.last) {
                // console.log("update", queriedList);
                expect(queriedStream.me.last).toMatchObject({
                    hello: "world",
                    id: map.id,
                });
                // console.log("final update", queriedList);
                resolve();
                unsubQuery();
            }
        });
    });

    const map = group.createMap<CoMap<{ hello: "world" }>>({
        hello: "world",
    });

    stream = stream.push(map);

    return done;
});
