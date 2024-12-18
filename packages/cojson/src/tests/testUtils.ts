import { metrics } from "@opentelemetry/api";
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  MetricReader,
} from "@opentelemetry/sdk-metrics";
import { expect, vi } from "vitest";
import { ControlledAgent } from "../coValues/account.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import type { CoID, RawCoValue } from "../exports.js";
import type { SessionID } from "../ids.js";
import { LocalNode } from "../localNode.js";
import { connectedPeers } from "../streamUtils.js";
import type { Peer, SyncMessage } from "../sync.js";
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

export async function createTwoConnectedNodes(
  node1Role: Peer["role"],
  node2Role: Peer["role"],
) {
  // Connect nodes initially
  const [node1ToNode2Peer, node2ToNode1Peer] = connectedPeers(
    "node1ToNode2",
    "node2ToNode1",
    {
      peer1role: node2Role,
      peer2role: node1Role,
    },
  );

  const node1 = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [node1ToNode2Peer],
    crypto: Crypto,
    creationProps: { name: "Client" },
  });

  const node2 = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [node2ToNode1Peer],
    crypto: Crypto,
    creationProps: { name: "Server" },
  });

  return {
    node1,
    node2,
    node1ToNode2Peer,
    node2ToNode1Peer,
  };
}

export async function createThreeConnectedNodes(
  node1Role: Peer["role"],
  node2Role: Peer["role"],
  node3Role: Peer["role"],
) {
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

  const node1 = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [node1ToNode2Peer, node1ToNode3Peer],
    crypto: Crypto,
    creationProps: { name: "Node 1" },
  });

  const node2 = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [node2ToNode1Peer, node2ToNode3Peer],
    crypto: Crypto,
    creationProps: { name: "Node 2" },
  });

  const node3 = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [node3ToNode1Peer, node3ToNode2Peer],
    crypto: Crypto,
    creationProps: { name: "Node 3" },
  });

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

export function blockMessageTypeOnOutgoingPeer(
  peer: Peer,
  messageType: SyncMessage["action"],
) {
  const push = peer.outgoing.push;
  const pushSpy = vi.spyOn(peer.outgoing, "push");

  const blockedMessages: SyncMessage[] = [];

  pushSpy.mockImplementation(async (msg) => {
    if (msg.action === messageType) {
      blockedMessages.push(msg);
      return Promise.resolve();
    }

    return push.call(peer.outgoing, msg);
  });

  return {
    sendBlockedMessages: async () => {
      for (const msg of blockedMessages) {
        await push.call(peer.outgoing, msg);
      }
      blockedMessages.length = 0;
    },
    unblock: () => pushSpy.mockRestore(),
  };
}

export function hotSleep(ms: number) {
  const before = Date.now();
  while (Date.now() < before + ms) {
    /* hot sleep */
  }
  return before;
}

/**
 * This is a test metric reader that uses an in-memory metric exporter and exposes a method to get the value of a metric given its name and attributes.
 *
 * This is useful for testing the values of metrics that are collected by the SDK.
 *
 * TODO: We may want to rethink how we access metrics (see `getMetricValue` method) to make it more flexible.
 */
class TestMetricReader extends MetricReader {
  private _exporter = new InMemoryMetricExporter(
    AggregationTemporality.CUMULATIVE,
  );

  protected onShutdown(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  protected onForceFlush(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async getMetricValue(
    name: string,
    attributes: { [key: string]: string | number } = {},
  ) {
    await this.collectAndExport();
    const metric = this._exporter
      .getMetrics()[0]
      ?.scopeMetrics[0]?.metrics.find((m) => m.descriptor.name === name);

    const dp = metric?.dataPoints.find(
      (dp) => JSON.stringify(dp.attributes) === JSON.stringify(attributes),
    );

    this._exporter.reset();

    return dp?.value;
  }

  async collectAndExport(): Promise<void> {
    const result = await this.collect();
    await new Promise<void>((resolve, reject) => {
      this._exporter.export(result.resourceMetrics, (result) => {
        if (result.error != null) {
          reject(result.error);
        } else {
          resolve();
        }
      });
    });
  }
}

export function createTestMetricReader() {
  const metricReader = new TestMetricReader();
  const success = metrics.setGlobalMeterProvider(
    new MeterProvider({
      readers: [metricReader],
    }),
  );

  expect(success).toBe(true);

  return metricReader;
}

export function tearDownTestMetricReader() {
  metrics.disable();
}
