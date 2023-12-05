import { cojsonReady } from "cojson";
import { autoSub } from ".";
import { SimpleAccount, SimpleGroup, co, im } from "jazz-schema";
import { GroupSchema } from "jazz-schema/src/group";

beforeEach(async () => {
    await cojsonReady;
});

test("Queries with maps work", async () => {
    const { me } = await new SimpleAccount({
        name: "Hermes Puggington",
    });

    const group = new SimpleGroup({ admin: me });

    class SubMap extends co
        .map({
            hello: im.const("world").or(im.const("moon")).or(im.const("sun")),
            id: im.string,
        })
        .partial() {}

    class Map extends co
        .map({
            hello: im.string,
            subMap: SubMap,
        })
        .partial() {}

    let map = new Map({}, { owner: group });

    const done = new Promise<void>((resolve) => {
        const unsubQuery = autoSub(map.id, { as: me }, (resolvedMap) => {
            // console.log("update", update);
            if (resolvedMap) {
                expect(resolvedMap._type).toBe("comap");
                expect(resolvedMap.id).toEqual(map.id);
                expect(resolvedMap.meta.owner).toBeInstanceOf(SimpleGroup);
                expect(resolvedMap.meta.owner.id).toBe(group.id);
                expect(resolvedMap.meta.headerMeta).toBe(null);
                expect(resolvedMap.hello).toBe("world");
                expect(Object.keys(resolvedMap)).toEqual(["hello", "subMap"]);
                if (resolvedMap.meta.edits.hello?.by?.profile?.name) {
                    expect(resolvedMap.meta.edits.hello.by.id).toEqual(me.id);
                    expect(resolvedMap.meta.edits.hello.by.profile.id).toEqual(
                        me.profile.id
                    );
                    expect(
                        resolvedMap.meta.edits.hello.by.profile.name
                    ).toEqual("Hermes Puggington");
                    expect(resolvedMap.meta.edits.hello.by.isMe).toBe(true);

                    if (resolvedMap.subMap) {
                        expect(resolvedMap.subMap._type).toBe("comap");
                        expect(resolvedMap.subMap.id).toEqual("foreignID");
                        expect(resolvedMap.subMap.meta.owner).toBeInstanceOf(
                            SimpleGroup
                        );
                        expect(resolvedMap.subMap.meta.owner.id).toBe(group.id);
                        expect(resolvedMap.subMap.meta.header).toBe(null);
                        if (resolvedMap.subMap.hello === "moon") {
                            // console.log("got to 'moon'");
                            resolvedMap.subMap.hello = "sun";
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

    map.hello = "world";

    let subMap = new SubMap({}, { owner: group });

    map.subMap = subMap;

    subMap.hello = "world";
    subMap.id = "foreignID";

    subMap.hello = "moon";

    await done;
});

test("Queries with lists work", async () => {
    const { me } = await new SimpleAccount({
        name: "Hermes Puggington",
    });

    const group = new SimpleGroup({ admin: me });

    class StringList extends co.list(im.string) {}

    let list = new StringList([], { owner: group });

    const done = new Promise<void>((resolve) => {
        const unsubQuery = autoSub(list.id, { as: me }, (resolvedList) => {
            if (resolvedList) {
                // console.log("update", resolvedList, resolvedList.meta.edits);
                expect(resolvedList._type).toBe("colist");
                expect(resolvedList.id).toEqual(list.id);
                expect(resolvedList.meta.owner).toBeInstanceOf(SimpleGroup);
                expect(resolvedList.meta.owner.id).toBe(group.id);
                expect(resolvedList.meta.headerMeta).toBe(null);
                expect(resolvedList[0]).toBe("hello");
                expect(resolvedList[1]).toBe("world");
                expect(resolvedList[2]).toBe("moon");
                if (resolvedList.meta.inserts[2]?.by?.profile?.name) {
                    expect(resolvedList.meta.inserts[2].by.id).toEqual(me.id);
                    expect(
                        resolvedList.meta.inserts[2].by.profile.name
                    ).toEqual("Hermes Puggington");
                    expect(resolvedList.meta.inserts[2].by.isMe).toBe(true);
                    expect(resolvedList.meta.inserts[2].at).toBeInstanceOf(
                        Date
                    );
                    if (resolvedList.length === 3) {
                        resolvedList.push("sun");
                    } else if (
                        resolvedList.length === 4 &&
                        resolvedList.meta.inserts[3]?.by?.profile?.name ===
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

    list.push("hello");
    list.push("world");
    list.push("moon");

    return done;
});

test("List of nested maps works", async () => {
    const { me } = await new SimpleAccount({
        name: "Hermes Puggington",
    });

    const group = new SimpleGroup({ admin: me });

    class ListOfMaps extends co.list(
        co.map({
            hello: im.const("world"),
        })
    ) {}

    let list = new ListOfMaps([], { owner: group });

    const done = new Promise<void>((resolve) => {
        const unsubQuery = autoSub(list.id, { as: me }, (resolvedList) => {
            if (resolvedList && resolvedList[0]) {
                // console.log("update", resolvedList);
                expect(resolvedList[0]).toMatchObject({
                    hello: "world",
                });
                // console.log("final update", resolvedList);
                resolve();
                unsubQuery();
            }
        });
    });

    list.push(
        new ListOfMaps._item(
            {
                hello: "world",
            },
            { owner: group }
        )
    );

    return done;
});

test("Can call .map on a coList", async () => {
    const { me } = await new SimpleAccount({
        name: "Hermes Puggington",
    });

    const group = new SimpleGroup({ admin: me });

    class ListOfStrings extends co.list(im.string) {}

    let list = new ListOfStrings([], { owner: group });

    const done = new Promise<void>((resolve) => {
        const unsubQuery = autoSub(list.id, { as: me }, (resolvedList) => {
            if (resolvedList && resolvedList[0] && resolvedList[1]) {
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

    list.push("hello");
    list.push("world");

    await done;
});

test("Queries with streams work", async () => {
    const { me } = await new SimpleAccount({
        name: "Hermes Puggington",
    });

    const group = new SimpleGroup({ admin: me });

    class StringStream extends co.stream(im.string) {}

    let stream = new StringStream({ owner: group });

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
