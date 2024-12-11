import { expect, test } from "vitest";
import { RawCoList } from "../coValues/coList.js";
import { RawCoMap } from "../coValues/coMap.js";
import { RawCoStream } from "../coValues/coStream.js";
import { RawBinaryCoStream } from "../coValues/coStream.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { LocalNode } from "../localNode.js";
import {
  createThreeConnectedNodes,
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
    createThreeConnectedNodes("server", "server", "server");

  const group = node1.createGroup();

  group.addMember(node2.account, "admin");
  group.addMember(node3.account, "reader");

  const groupOnNode2 = await loadCoValueOrFail(node2, group.id);

  // The account of node2 create a child group and extend the initial group
  // This way the node1 account should become "admin" of the child group
  // by inheriting the admin role from the initial group
  const childGroup = node2.createGroup();
  childGroup.extend(groupOnNode2);

  const map = childGroup.createMap();
  map.set("test", "Available to everyone");

  const mapOnNode3 = await loadCoValueOrFail(node3, map.id);

  // Check that the sync between node2 and node3 worked
  expect(mapOnNode3.get("test")).toEqual("Available to everyone");

  // The node1 account removes the reader from the group
  // The reader should be automatically kicked out of the child group
  await group.removeMember(node3.account);

  await group.core.waitForSync();

  // Update the map to check that node3 can't read updates anymore
  map.set("test", "Hidden to node3");

  await map.core.waitForSync();

  // Check that the value has not been updated on node3
  expect(mapOnNode3.get("test")).toEqual("Available to everyone");

  const mapOnNode1 = await loadCoValueOrFail(node1, map.id);

  expect(mapOnNode1.get("test")).toEqual("Hidden to node3");
});

test("An admin should be able to rotate the readKey on child groups and keep access to new coValues", async () => {
  const { node1, node2, node3, node1ToNode2Peer, node2ToNode1Peer } =
    createThreeConnectedNodes("server", "server", "server");

  const group = node1.createGroup();

  group.addMember(node2.account, "admin");
  group.addMember(node3.account, "reader");

  const groupOnNode2 = await loadCoValueOrFail(node2, group.id);

  // The account of node2 create a child group and extend the initial group
  // This way the node1 account should become "admin" of the child group
  // by inheriting the admin role from the initial group
  const childGroup = node2.createGroup();
  childGroup.extend(groupOnNode2);

  await childGroup.core.waitForSync();

  // The node1 account removes the reader from the group
  // In this case we want to ensure that node1 is still able to read new coValues
  // Even if some childs are not available when the readKey is rotated
  await group.removeMember(node3.account);
  await group.core.waitForSync();

  const map = childGroup.createMap();
  map.set("test", "Available to node1");

  const mapOnNode1 = await loadCoValueOrFail(node1, map.id);
  expect(mapOnNode1.get("test")).toEqual("Available to node1");
});

test("An admin should be able to rotate the readKey on child groups even if it was unavailable when kicking out a member from a parent group", async () => {
  const { node1, node2, node3, node1ToNode2Peer, node2ToNode1Peer } =
    createThreeConnectedNodes("server", "server", "server");

  const group = node1.createGroup();

  group.addMember(node2.account, "admin");
  group.addMember(node3.account, "reader");

  const groupOnNode2 = await loadCoValueOrFail(node2, group.id);

  // The account of node2 create a child group and extend the initial group
  // This way the node1 account should become "admin" of the child group
  // by inheriting the admin role from the initial group
  const childGroup = node2.createGroup();
  childGroup.extend(groupOnNode2);

  // The node1 account removes the reader from the group
  // In this case we want to ensure that node1 is still able to read new coValues
  // Even if some childs are not available when the readKey is rotated
  await group.removeMember(node3.account);
  await group.core.waitForSync();

  const map = childGroup.createMap();
  map.set("test", "Available to node1");

  const mapOnNode1 = await loadCoValueOrFail(node1, map.id);
  expect(mapOnNode1.get("test")).toEqual("Available to node1");
});

test("An admin should be able to rotate the readKey on child groups even if it was unavailable when kicking out a member from a parent group (grandChild)", async () => {
  const { node1, node2, node3, node1ToNode2Peer } = createThreeConnectedNodes(
    "server",
    "server",
    "server",
  );

  const group = node1.createGroup();

  group.addMember(node2.account, "admin");
  group.addMember(node3.account, "reader");

  const groupOnNode2 = await loadCoValueOrFail(node2, group.id);

  // The account of node2 create a child group and extend the initial group
  // This way the node1 account should become "admin" of the child group
  // by inheriting the admin role from the initial group
  const childGroup = node2.createGroup();
  childGroup.extend(groupOnNode2);
  const grandChildGroup = node2.createGroup();
  grandChildGroup.extend(childGroup);

  // The node1 account removes the reader from the group
  // In this case we want to ensure that node1 is still able to read new coValues
  // Even if some childs are not available when the readKey is rotated
  await group.removeMember(node3.account);
  await group.core.waitForSync();

  const map = childGroup.createMap();
  map.set("test", "Available to node1");

  const mapOnNode1 = await loadCoValueOrFail(node1, map.id);

  expect(mapOnNode1.get("test")).toEqual("Available to node1");
});
