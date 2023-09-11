import { LocalNode, CoMap, CoList, CoStream, BinaryCoStream, cojsonReady } from "./index";
import { randomAnonymousAccountAndSessionID } from "./testUtils";

beforeEach(async () => {
    await cojsonReady;
});

test("Can create a CoMap in a group", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const group = node.createGroup();

    const map = group.createMap();

    expect(map.core.getCurrentContent().type).toEqual("comap");
    expect(map instanceof CoMap).toEqual(true);
});

test("Can create a CoList in a group", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const group = node.createGroup();

    const list = group.createList();

    expect(list.core.getCurrentContent().type).toEqual("colist");
    expect(list instanceof CoList).toEqual(true);
})

test("Can create a CoStream in a group", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const group = node.createGroup();

    const stream = group.createStream();

    expect(stream.core.getCurrentContent().type).toEqual("costream");
    expect(stream instanceof CoStream).toEqual(true);
});

test("Can create a BinaryCoStream in a group", () => {
    const node = new LocalNode(...randomAnonymousAccountAndSessionID());

    const group = node.createGroup();

    const stream = group.createBinaryStream();

    expect(stream.core.getCurrentContent().type).toEqual("costream");
    expect(stream.meta.type).toEqual("binary");
    expect(stream instanceof BinaryCoStream).toEqual(true);
})