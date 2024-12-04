import { expect } from "vitest";
import { ControlledAgent } from "../coValues/account.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { CoID, RawCoValue } from "../exports.js";
import { SessionID } from "../ids.js";
import { LocalNode } from "../localNode.js";
import { connectedPeers } from "../streamUtils.js";
import { Peer } from "../sync.js";
import { expectGroup } from "../typeUtils/expectGroup.js";

const Crypto = await WasmCrypto.create();

export function randomAnonymousAccountAndSessionID(): [
  ControlledAgent,
  SessionID,
] {
  const agentSecret = Crypto.newRandomAgentSecret();

  const sessionID = Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret));

  return [new ControlledAgent(agentSecret, Crypto), sessionID];
}

export function createTestNode() {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  return new LocalNode(admin, session, Crypto);
}

export function createTwoConnectedNodes(
  node1Role: Peer["role"],
  node2Role: Peer["role"],
) {
  // Setup nodes
  const node1 = createTestNode();
  const node2 = createTestNode();

  // Connect nodes initially
  const [node1ToNode2Peer, node2ToNode1Peer] = connectedPeers(
    "node1ToNode2",
    "node2ToNode1",
    {
      peer1role: node2Role,
      peer2role: node1Role,
    },
  );

  node1.syncManager.addPeer(node1ToNode2Peer);
  node2.syncManager.addPeer(node2ToNode1Peer);

  return {
    node1,
    node2,
    node1ToNode2Peer,
    node2ToNode1Peer,
  };
}

export function createThreeConnectedNodes(
  node1Role: Peer["role"],
  node2Role: Peer["role"],
  node3Role: Peer["role"],
) {
  // Setup nodes
  const node1 = createTestNode();
  const node2 = createTestNode();
  const node3 = createTestNode();

  // Connect nodes initially
  const [node1ToNode2Peer, node2ToNode1Peer] = connectedPeers(
    "node1ToNode2",
    "node2ToNode1",
    {
      peer1role: node2Role,
      peer2role: node1Role,
    },
  );

  const [node1ToNode3Peer, node3ToNode1Peer] = connectedPeers(
    "node1ToNode3",
    "node3ToNode1",
    {
      peer1role: node3Role,
      peer2role: node1Role,
    },
  );

  const [node2ToNode3Peer, node3ToNode2Peer] = connectedPeers(
    "node2ToNode3",
    "node3ToNode2",
    {
      peer1role: node3Role,
      peer2role: node2Role,
    },
  );

  node1.syncManager.addPeer(node1ToNode2Peer);
  node1.syncManager.addPeer(node1ToNode3Peer);
  node2.syncManager.addPeer(node2ToNode1Peer);
  node2.syncManager.addPeer(node2ToNode3Peer);
  node3.syncManager.addPeer(node3ToNode1Peer);
  node3.syncManager.addPeer(node3ToNode2Peer);

  return {
    node1,
    node2,
    node3,
    node1ToNode2Peer,
    node2ToNode1Peer,
    node1ToNode3Peer,
    node3ToNode1Peer,
    node2ToNode3Peer,
    node3ToNode2Peer,
  };
}

export function newGroup() {
  const [admin, sessionID] = randomAnonymousAccountAndSessionID();

  const node = new LocalNode(admin, sessionID, Crypto);

  const groupCore = node.createCoValue({
    type: "comap",
    ruleset: { type: "group", initialAdmin: admin.id },
    meta: null,
    ...Crypto.createdNowUnique(),
  });

  const group = expectGroup(groupCore.getCurrentContent());

  group.set(admin.id, "admin", "trusting");
  expect(group.get(admin.id)).toEqual("admin");

  return { node, groupCore, admin };
}

export function groupWithTwoAdmins() {
  const { groupCore, admin, node } = newGroup();

  const otherAdmin = node.createAccount();

  const group = expectGroup(groupCore.getCurrentContent());

  group.set(otherAdmin.id, "admin", "trusting");
  expect(group.get(otherAdmin.id)).toEqual("admin");

  if (group.type !== "comap") {
    throw new Error("Expected map");
  }

  expect(group.get(otherAdmin.id)).toEqual("admin");
  return { group, groupCore, admin, otherAdmin, node };
}

export function newGroupHighLevel() {
  const [admin, sessionID] = randomAnonymousAccountAndSessionID();

  const node = new LocalNode(admin, sessionID, Crypto);

  const group = node.createGroup();

  return { admin, node, group };
}

export function groupWithTwoAdminsHighLevel() {
  const { admin, node, group } = newGroupHighLevel();

  const otherAdmin = node.createAccount();

  group.addMember(otherAdmin, "admin");

  return { admin, node, group, otherAdmin };
}

export function shouldNotResolve<T>(
  promise: Promise<T>,
  ops: { timeout: number },
): Promise<void> {
  return new Promise((resolve, reject) => {
    promise
      .then((v) =>
        reject(
          new Error(
            "Should not have resolved, but resolved to " + JSON.stringify(v),
          ),
        ),
      )
      .catch(reject);
    setTimeout(resolve, ops.timeout);
  });
}

export function waitFor(callback: () => boolean | void) {
  return new Promise<void>((resolve, reject) => {
    const checkPassed = () => {
      try {
        return { ok: callback(), error: null };
      } catch (error) {
        return { ok: false, error };
      }
    };

    let retries = 0;

    const interval = setInterval(() => {
      const { ok, error } = checkPassed();

      if (ok !== false) {
        clearInterval(interval);
        resolve();
      }

      if (++retries > 10) {
        clearInterval(interval);
        reject(error);
      }
    }, 100);
  });
}

export async function loadCoValueOrFail<V extends RawCoValue>(
  node: LocalNode,
  id: CoID<V>,
): Promise<V> {
  const value = await node.load(id);
  if (value === "unavailable") {
    throw new Error("CoValue not found");
  }
  return value;
}
