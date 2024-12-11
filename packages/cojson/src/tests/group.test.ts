import { describe, expect, test } from "vitest";
import { RawCoList } from "../coValues/coList.js";
import { RawCoMap } from "../coValues/coMap.js";
import { RawCoStream } from "../coValues/coStream.js";
import { RawBinaryCoStream } from "../coValues/coStream.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { LocalNode } from "../localNode.js";
import {
  createThreeConnectedNodes,
  createTwoConnectedNodes,
  loadCoValueOrFail,
  randomAnonymousAccountAndSessionID,
} from "./testUtils.js";

const Crypto = await WasmCrypto.create();

test("Can create a RawCoMap in a group", () => {
  const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

  const group = node.createGroup();

  const map = group.createMap();

  expect(map.core.getCurrentContent().type).toEqual("comap");
  expect(map instanceof RawCoMap).toEqual(true);
});

test("Can create a CoList in a group", () => {
  const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

  const group = node.createGroup();

  const list = group.createList();

  expect(list.core.getCurrentContent().type).toEqual("colist");
  expect(list instanceof RawCoList).toEqual(true);
});

test("Can create a CoStream in a group", () => {
  const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

  const group = node.createGroup();

  const stream = group.createStream();

  expect(stream.core.getCurrentContent().type).toEqual("costream");
  expect(stream instanceof RawCoStream).toEqual(true);
});

test("Can create a FileStream in a group", () => {
  const node = new LocalNode(...randomAnonymousAccountAndSessionID(), Crypto);

  const group = node.createGroup();

  const stream = group.createBinaryStream();

  expect(stream.core.getCurrentContent().type).toEqual("costream");
  expect(stream.headerMeta.type).toEqual("binary");
  expect(stream instanceof RawBinaryCoStream).toEqual(true);
});

test("Remove a member from a group where the admin role is inherited", async () => {
  const { node1, node2, node3, node1ToNode2Peer, node2ToNode3Peer } =
    await createThreeConnectedNodes("server", "server", "server");

  const group = node1.node.createGroup();

  group.addMember(
    await loadCoValueOrFail(node1.node, node2.accountID),
    "admin",
  );
  group.addMember(
    await loadCoValueOrFail(node1.node, node3.accountID),
    "reader",
  );

  await group.core.waitForSync();

  const groupOnNode2 = await loadCoValueOrFail(node2.node, group.id);

  // The account of node2 create a child group and extend the initial group
  // This way the node1 account should become "admin" of the child group
  // by inheriting the admin role from the initial group
  const childGroup = node2.node.createGroup();
  childGroup.extend(groupOnNode2);

  const map = childGroup.createMap();
  map.set("test", "Available to everyone");

  const mapOnNode3 = await loadCoValueOrFail(node3.node, map.id);

  // Check that the sync between node2 and node3 worked
  expect(mapOnNode3.get("test")).toEqual("Available to everyone");

  // The node1 account removes the reader from the group
  // The reader should be automatically kicked out of the child group
  await group.removeMember(node3.node.account);

  await group.core.waitForSync();

  // Update the map to check that node3 can't read updates anymore
  map.set("test", "Hidden to node3");

  await map.core.waitForSync();

  // Check that the value has not been updated on node3
  expect(mapOnNode3.get("test")).toEqual("Available to everyone");

  const mapOnNode1 = await loadCoValueOrFail(node1.node, map.id);

  expect(mapOnNode1.get("test")).toEqual("Hidden to node3");
});

test("An admin should be able to rotate the readKey on child groups and keep access to new coValues", async () => {
  const { node1, node2, node3, node1ToNode2Peer, node2ToNode1Peer } =
    await createThreeConnectedNodes("server", "server", "server");

  const group = node1.node.createGroup();

  group.addMember(
    await loadCoValueOrFail(node1.node, node2.accountID),
    "admin",
  );
  group.addMember(
    await loadCoValueOrFail(node1.node, node3.accountID),
    "reader",
  );

  await group.core.waitForSync();

  const groupOnNode2 = await loadCoValueOrFail(node2.node, group.id);

  // The account of node2 create a child group and extend the initial group
  // This way the node1 account should become "admin" of the child group
  // by inheriting the admin role from the initial group
  const childGroup = node2.node.createGroup();
  childGroup.extend(groupOnNode2);

  await childGroup.core.waitForSync();

  // The node1 account removes the reader from the group
  // In this case we want to ensure that node1 is still able to read new coValues
  // Even if some childs are not available when the readKey is rotated
  await group.removeMember(node3.node.account);
  await group.core.waitForSync();

  const map = childGroup.createMap();
  map.set("test", "Available to node1");

  const mapOnNode1 = await loadCoValueOrFail(node1.node, map.id);
  expect(mapOnNode1.get("test")).toEqual("Available to node1");
});

test("An admin should be able to rotate the readKey on child groups even if it was unavailable when kicking out a member from a parent group", async () => {
  const { node1, node2, node3, node1ToNode2Peer, node2ToNode1Peer } =
    await createThreeConnectedNodes("server", "server", "server");

  const group = node1.node.createGroup();

  group.addMember(
    await loadCoValueOrFail(node1.node, node2.accountID),
    "admin",
  );
  group.addMember(
    await loadCoValueOrFail(node1.node, node3.accountID),
    "reader",
  );

  await group.core.waitForSync();

  const groupOnNode2 = await loadCoValueOrFail(node2.node, group.id);

  // The account of node2 create a child group and extend the initial group
  // This way the node1 account should become "admin" of the child group
  // by inheriting the admin role from the initial group
  const childGroup = node2.node.createGroup();
  childGroup.extend(groupOnNode2);

  // The node1 account removes the reader from the group
  // In this case we want to ensure that node1 is still able to read new coValues
  // Even if some childs are not available when the readKey is rotated
  await group.removeMember(node3.node.account);
  await group.core.waitForSync();

  const map = childGroup.createMap();
  map.set("test", "Available to node1");

  const mapOnNode1 = await loadCoValueOrFail(node1.node, map.id);
  expect(mapOnNode1.get("test")).toEqual("Available to node1");
});

test("An admin should be able to rotate the readKey on child groups even if it was unavailable when kicking out a member from a parent group (grandChild)", async () => {
  const { node1, node2, node3, node1ToNode2Peer } =
    await createThreeConnectedNodes("server", "server", "server");

  const group = node1.node.createGroup();

  group.addMember(
    await loadCoValueOrFail(node1.node, node2.accountID),
    "admin",
  );
  group.addMember(
    await loadCoValueOrFail(node1.node, node3.accountID),
    "reader",
  );

  await group.core.waitForSync();

  const groupOnNode2 = await loadCoValueOrFail(node2.node, group.id);

  // The account of node2 create a child group and extend the initial group
  // This way the node1 account should become "admin" of the child group
  // by inheriting the admin role from the initial group
  const childGroup = node2.node.createGroup();
  childGroup.extend(groupOnNode2);
  const grandChildGroup = node2.node.createGroup();
  grandChildGroup.extend(childGroup);

  // The node1 account removes the reader from the group
  // In this case we want to ensure that node1 is still able to read new coValues
  // Even if some childs are not available when the readKey is rotated
  await group.removeMember(node3.node.account);
  await group.core.waitForSync();

  const map = childGroup.createMap();
  map.set("test", "Available to node1");

  const mapOnNode1 = await loadCoValueOrFail(node1.node, map.id);

  expect(mapOnNode1.get("test")).toEqual("Available to node1");
});

test("A user add after a key rotation should have access to the old transactions", async () => {
  const { node1, node2, node3, node1ToNode2Peer, node2ToNode1Peer } =
    await createThreeConnectedNodes("server", "server", "server");

  const group = node1.node.createGroup();

  group.addMember(
    await loadCoValueOrFail(node1.node, node2.accountID),
    "writer",
  );

  await group.core.waitForSync();

  const groupOnNode2 = await loadCoValueOrFail(node2.node, group.id);

  const map = groupOnNode2.createMap();
  map.set("test", "Written from node2");

  await map.core.waitForSync();

  await group.removeMember(node3.node.account);
  group.addMember(
    await loadCoValueOrFail(node1.node, node3.accountID),
    "reader",
  );

  await group.core.waitForSync();

  const mapOnNode3 = await loadCoValueOrFail(node3.node, map.id);
  expect(mapOnNode3.get("test")).toEqual("Written from node2");
});

test("Invites should have access to the new keys", async () => {
  const { node1, node2, node3, node1ToNode2Peer } =
    await createThreeConnectedNodes("server", "server", "server");

  const group = node1.node.createGroup();
  group.addMember(
    await loadCoValueOrFail(node1.node, node3.accountID),
    "reader",
  );

  const invite = group.createInvite("admin");

  await group.removeMember(node3.node.account);

  const map = group.createMap();
  map.set("test", "Written from node1");

  await map.core.waitForSync();

  await node2.node.acceptInvite(group.id, invite);

  const mapOnNode2 = await loadCoValueOrFail(node2.node, map.id);
  expect(mapOnNode2.get("test")).toEqual("Written from node1");
});

describe("writeOnly", () => {
  test("Admins can invite writeOnly members", async () => {
    const { node1, node2 } = await createTwoConnectedNodes("server", "server");

    const group = node1.node.createGroup();

    const invite = group.createInvite("writeOnly");

    await node2.node.acceptInvite(group.id, invite);

    const groupOnNode2 = await loadCoValueOrFail(node2.node, group.id);
    expect(groupOnNode2.myRole()).toEqual("writeOnly");
  });

  test("Edits by writeOnly members are visible to other members", async () => {
    const { node1, node2, node3, node1ToNode2Peer, node2ToNode1Peer } =
      await createThreeConnectedNodes("server", "server", "server");

    const group = node1.node.createGroup();

    group.addMember(
      await loadCoValueOrFail(node1.node, node2.accountID),
      "writeOnly",
    );
    group.addMember(
      await loadCoValueOrFail(node1.node, node3.accountID),
      "reader",
    );

    await group.core.waitForSync();

    const groupOnNode2 = await loadCoValueOrFail(node2.node, group.id);
    const map = groupOnNode2.createMap();

    map.set("test", "Written from a writeOnly member");
    expect(map.get("test")).toEqual("Written from a writeOnly member");

    await map.core.waitForSync();

    const mapOnNode1 = await loadCoValueOrFail(node1.node, map.id);
    expect(mapOnNode1.get("test")).toEqual("Written from a writeOnly member");

    const mapOnNode3 = await loadCoValueOrFail(node3.node, map.id);
    expect(mapOnNode3.get("test")).toEqual("Written from a writeOnly member");
  });

  test("Edits by other members are not visible to writeOnly members", async () => {
    const { node1, node2, node1ToNode2Peer } = await createTwoConnectedNodes(
      "server",
      "server",
    );

    const group = node1.node.createGroup();

    group.addMember(
      await loadCoValueOrFail(node1.node, node2.accountID),
      "writeOnly",
    );
    const map = group.createMap();
    map.set("test", "Written from the admin");

    await map.core.waitForSync();

    const mapOnNode2 = await loadCoValueOrFail(node2.node, map.id);
    expect(mapOnNode2.get("test")).toEqual(undefined);
  });

  test("Write only member keys are rotated when a member is kicked out", async () => {
    const {
      node1,
      node2,
      node3,
      node1ToNode2Peer,
      node2ToNode1Peer,
      node2ToNode3Peer,
    } = await createThreeConnectedNodes("server", "server", "server");

    const group = node1.node.createGroup();

    group.addMember(
      await loadCoValueOrFail(node1.node, node2.accountID),
      "writeOnly",
    );
    group.addMember(
      await loadCoValueOrFail(node1.node, node3.accountID),
      "reader",
    );

    await group.core.waitForSync();

    const groupOnNode2 = await loadCoValueOrFail(node2.node, group.id);
    const map = groupOnNode2.createMap();

    map.set("test", "Written from a writeOnly member");

    await map.core.waitForSync();

    await group.removeMember(node3.node.account);

    await group.core.waitForSync();

    map.set("test", "Updated after key rotation");

    await map.core.waitForSync();

    const mapOnNode1 = await loadCoValueOrFail(node1.node, map.id);
    expect(mapOnNode1.get("test")).toEqual("Updated after key rotation");

    const mapOnNode3 = await loadCoValueOrFail(node3.node, map.id);
    expect(mapOnNode3.get("test")).toEqual("Written from a writeOnly member");
  });
});
