import { describe, expect, test, vi } from "vitest";
import { expectMap } from "../coValue.js";
import { CoValueHeader } from "../coValueCore.js";
import { RawAccountID } from "../coValues/account.js";
import { MapOpPayload, RawCoMap } from "../coValues/coMap.js";
import { RawGroup } from "../coValues/group.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { stableStringify } from "../jsonStringify.js";
import { LocalNode } from "../localNode.js";
import { getPriorityFromHeader } from "../priority.js";
import { connectedPeers, newQueuePair } from "../streamUtils.js";
import { SyncMessage } from "../sync.js";
import {
  blockMessageTypeOnOutgoingPeer,
  createTestNode,
  randomAnonymousAccountAndSessionID,
  waitFor,
} from "./testUtils.js";

const Crypto = await WasmCrypto.create();

test("Node replies with initial tx and header to empty subscribe", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  const node = new LocalNode(admin, session, Crypto);

  const group = node.createGroup();

  const map = group.createMap();

  map.set("hello", "world", "trusting");

  const [inRx, inTx] = newQueuePair();
  const [outRx, outTx] = newQueuePair();
  const outRxQ = outRx[Symbol.asyncIterator]();

  node.syncManager.addPeer({
    id: "test",
    incoming: inRx,
    outgoing: outTx,
    role: "peer",
    crashOnClose: true,
  });

  await inTx.push({
    action: "load",
    id: map.core.id,
    header: false,
    sessions: {},
  });

  // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

  const mapTellKnownStateMsg = (await outRxQ.next()).value;
  expect(mapTellKnownStateMsg).toEqual({
    action: "known",
    ...map.core.knownState(),
  } satisfies SyncMessage);

  // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

  const newContentMsg = (await outRxQ.next()).value;

  const expectedHeader = {
    type: "comap",
    ruleset: { type: "ownedByGroup", group: group.id },
    meta: null,
    createdAt: map.core.header.createdAt,
    uniqueness: map.core.header.uniqueness,
  } satisfies CoValueHeader;

  expect(newContentMsg).toEqual({
    action: "content",
    id: map.core.id,
    header: expectedHeader,
    new: {
      [node.currentSessionID]: {
        after: 0,
        newTransactions: [
          {
            privacy: "trusting" as const,
            madeAt: map.core.sessionLogs.get(node.currentSessionID)!
              .transactions[0]!.madeAt,
            changes: stableStringify([
              {
                op: "set",
                key: "hello",
                value: "world",
              } satisfies MapOpPayload<string, string>,
            ]),
          },
        ],
        lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
          .lastSignature!,
      },
    },
    priority: getPriorityFromHeader(map.core.header),
  } satisfies SyncMessage);
});

test("Node replies with only new tx to subscribe with some known state", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  const node = new LocalNode(admin, session, Crypto);

  const group = node.createGroup();

  const map = group.createMap();

  map.set("hello", "world", "trusting");
  map.set("goodbye", "world", "trusting");

  const [inRx, inTx] = newQueuePair();
  const [outRx, outTx] = newQueuePair();
  const outRxQ = outRx[Symbol.asyncIterator]();

  node.syncManager.addPeer({
    id: "test",
    incoming: inRx,
    outgoing: outTx,
    role: "peer",
    crashOnClose: true,
  });

  await inTx.push({
    action: "load",
    id: map.core.id,
    header: true,
    sessions: {
      [node.currentSessionID]: 1,
    },
  });

  // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

  const mapTellKnownStateMsg = (await outRxQ.next()).value;
  expect(mapTellKnownStateMsg).toEqual({
    action: "known",
    ...map.core.knownState(),
  } satisfies SyncMessage);

  // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

  const mapNewContentMsg = (await outRxQ.next()).value;

  expect(mapNewContentMsg).toEqual({
    action: "content",
    id: map.core.id,
    header: undefined,
    new: {
      [node.currentSessionID]: {
        after: 1,
        newTransactions: [
          {
            privacy: "trusting" as const,
            madeAt: map.core.sessionLogs.get(node.currentSessionID)!
              .transactions[1]!.madeAt,
            changes: stableStringify([
              {
                op: "set",
                key: "goodbye",
                value: "world",
              } satisfies MapOpPayload<string, string>,
            ]),
          },
        ],
        lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
          .lastSignature!,
      },
    },
    priority: getPriorityFromHeader(map.core.header),
  } satisfies SyncMessage);
});
test.todo(
  "TODO: node only replies with new tx to subscribe with some known state, even in the depended on coValues",
);

test("After subscribing, node sends own known state and new txs to peer", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  const node = new LocalNode(admin, session, Crypto);

  const group = node.createGroup();

  const map = group.createMap();

  const [inRx, inTx] = newQueuePair();
  const [outRx, outTx] = newQueuePair();
  const outRxQ = outRx[Symbol.asyncIterator]();

  node.syncManager.addPeer({
    id: "test",
    incoming: inRx,
    outgoing: outTx,
    role: "peer",
    crashOnClose: true,
  });

  await inTx.push({
    action: "load",
    id: map.core.id,
    header: false,
    sessions: {
      [node.currentSessionID]: 0,
    },
  });

  // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

  const mapTellKnownStateMsg = (await outRxQ.next()).value;
  expect(mapTellKnownStateMsg).toEqual({
    action: "known",
    ...map.core.knownState(),
  } satisfies SyncMessage);

  // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

  const mapNewContentHeaderOnlyMsg = (await outRxQ.next()).value;

  expect(mapNewContentHeaderOnlyMsg).toEqual({
    action: "content",
    id: map.core.id,
    header: map.core.header,
    new: {},
    priority: getPriorityFromHeader(map.core.header),
  } satisfies SyncMessage);

  map.set("hello", "world", "trusting");

  const mapEditMsg1 = (await outRxQ.next()).value;

  expect(mapEditMsg1).toEqual({
    action: "content",
    id: map.core.id,
    new: {
      [node.currentSessionID]: {
        after: 0,
        newTransactions: [
          {
            privacy: "trusting" as const,
            madeAt: map.core.sessionLogs.get(node.currentSessionID)!
              .transactions[0]!.madeAt,
            changes: stableStringify([
              {
                op: "set",
                key: "hello",
                value: "world",
              } satisfies MapOpPayload<string, string>,
            ]),
          },
        ],
        lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
          .lastSignature!,
      },
    },
    priority: getPriorityFromHeader(map.core.header),
  } satisfies SyncMessage);

  map.set("goodbye", "world", "trusting");

  const mapEditMsg2 = (await outRxQ.next()).value;

  expect(mapEditMsg2).toEqual({
    action: "content",
    id: map.core.id,
    new: {
      [node.currentSessionID]: {
        after: 1,
        newTransactions: [
          {
            privacy: "trusting" as const,
            madeAt: map.core.sessionLogs.get(node.currentSessionID)!
              .transactions[1]!.madeAt,
            changes: stableStringify([
              {
                op: "set",
                key: "goodbye",
                value: "world",
              } satisfies MapOpPayload<string, string>,
            ]),
          },
        ],
        lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
          .lastSignature!,
      },
    },
    priority: getPriorityFromHeader(map.core.header),
  } satisfies SyncMessage);
});

test("Client replies with known new content to tellKnownState from server", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  const node = new LocalNode(admin, session, Crypto);

  const group = node.createGroup();

  const map = group.createMap();

  map.set("hello", "world", "trusting");

  const [inRx, inTx] = newQueuePair();
  const [outRx, outTx] = newQueuePair();
  const outRxQ = outRx[Symbol.asyncIterator]();

  node.syncManager.addPeer({
    id: "test",
    incoming: inRx,
    outgoing: outTx,
    role: "peer",
    crashOnClose: true,
  });

  // expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

  await inTx.push({
    action: "known",
    id: map.core.id,
    header: false,
    sessions: {
      [node.currentSessionID]: 0,
    },
  });

  // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

  const mapTellKnownStateMsg = (await outRxQ.next()).value;
  expect(mapTellKnownStateMsg).toEqual({
    action: "known",
    ...map.core.knownState(),
  } satisfies SyncMessage);

  // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

  const mapNewContentMsg = (await outRxQ.next()).value;

  expect(mapNewContentMsg).toEqual({
    action: "content",
    id: map.core.id,
    header: map.core.header,
    new: {
      [node.currentSessionID]: {
        after: 0,
        newTransactions: [
          {
            privacy: "trusting" as const,
            madeAt: map.core.sessionLogs.get(node.currentSessionID)!
              .transactions[0]!.madeAt,
            changes: stableStringify([
              {
                op: "set",
                key: "hello",
                value: "world",
              } satisfies MapOpPayload<string, string>,
            ]),
          },
        ],
        lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
          .lastSignature!,
      },
    },
    priority: getPriorityFromHeader(map.core.header),
  } satisfies SyncMessage);
});

test("No matter the optimistic known state, node respects invalid known state messages and resyncs", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  const node = new LocalNode(admin, session, Crypto);

  const group = node.createGroup();

  const map = group.createMap();

  const [inRx, inTx] = newQueuePair();
  const [outRx, outTx] = newQueuePair();
  const outRxQ = outRx[Symbol.asyncIterator]();

  node.syncManager.addPeer({
    id: "test",
    incoming: inRx,
    outgoing: outTx,
    role: "peer",
    crashOnClose: true,
  });

  await inTx.push({
    action: "load",
    id: map.core.id,
    header: false,
    sessions: {
      [node.currentSessionID]: 0,
    },
  });

  // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

  const mapTellKnownStateMsg = (await outRxQ.next()).value;
  expect(mapTellKnownStateMsg).toEqual({
    action: "known",
    ...map.core.knownState(),
  } satisfies SyncMessage);

  // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

  const mapNewContentHeaderOnlyMsg = (await outRxQ.next()).value;

  expect(mapNewContentHeaderOnlyMsg).toEqual({
    action: "content",
    id: map.core.id,
    header: map.core.header,
    new: {},
    priority: getPriorityFromHeader(map.core.header),
  } satisfies SyncMessage);

  map.set("hello", "world", "trusting");

  map.set("goodbye", "world", "trusting");

  const _mapEditMsgs = (await outRxQ.next()).value;

  console.log("Sending correction");

  await inTx.push({
    action: "known",
    isCorrection: true,
    id: map.core.id,
    header: true,
    sessions: {
      [node.currentSessionID]: 1,
    },
  } satisfies SyncMessage);

  const newContentAfterWrongAssumedState = (await outRxQ.next()).value;

  expect(newContentAfterWrongAssumedState).toEqual({
    action: "content",
    id: map.core.id,
    header: undefined,
    new: {
      [node.currentSessionID]: {
        after: 1,
        newTransactions: [
          {
            privacy: "trusting" as const,
            madeAt: map.core.sessionLogs.get(node.currentSessionID)!
              .transactions[1]!.madeAt,
            changes: stableStringify([
              {
                op: "set",
                key: "goodbye",
                value: "world",
              } satisfies MapOpPayload<string, string>,
            ]),
          },
        ],
        lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
          .lastSignature!,
      },
    },
    priority: getPriorityFromHeader(map.core.header),
  } satisfies SyncMessage);
});

test("If we add a peer, but it never subscribes to a coValue, it won't get any messages", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  const node = new LocalNode(admin, session, Crypto);

  const group = node.createGroup();

  const map = group.createMap();

  const [inRx, _inTx] = newQueuePair();
  const [outRx, outTx] = newQueuePair();
  const outRxQ = outRx[Symbol.asyncIterator]();

  node.syncManager.addPeer({
    id: "test",
    incoming: inRx,
    outgoing: outTx,
    role: "peer",
    crashOnClose: true,
  });

  map.set("hello", "world", "trusting");

  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve("neverHappened"), 100),
  );

  const result = await Promise.race([
    outRxQ.next().then((value) => value.value),
    timeoutPromise,
  ]);

  expect(result).toEqual("neverHappened");
});

test.todo(
  "If we add a server peer, all updates to all coValues are sent to it, even if it doesn't subscribe",
  async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, _inTx] = newQueuePair();
    const [outRx, outTx] = newQueuePair();
    const outRxQ = outRx[Symbol.asyncIterator]();

    node.syncManager.addPeer({
      id: "test",
      incoming: inRx,
      outgoing: outTx,
      role: "server",
      crashOnClose: true,
    });

    // expect((await outRxQ.next()).value).toMatchObject({
    //     action: "load",
    //     id: adminID,
    // });
    expect((await outRxQ.next()).value).toMatchObject({
      action: "load",
      id: group.core.id,
    });

    const mapSubscribeMsg = (await outRxQ.next()).value;

    expect(mapSubscribeMsg).toEqual({
      action: "load",
      id: map.core.id,
      header: true,
      sessions: {},
    } satisfies SyncMessage);

    map.set("hello", "world", "trusting");

    // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

    const mapNewContentMsg = (await outRxQ.next()).value;

    expect(mapNewContentMsg).toEqual({
      action: "content",
      id: map.core.id,
      header: map.core.header,
      new: {
        [node.currentSessionID]: {
          after: 0,
          newTransactions: [
            {
              privacy: "trusting" as const,
              madeAt: map.core.sessionLogs.get(node.currentSessionID)!
                .transactions[0]!.madeAt,
              changes: stableStringify([
                {
                  op: "set",
                  key: "hello",
                  value: "world",
                } satisfies MapOpPayload<string, string>,
              ]),
            },
          ],
          lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
            .lastSignature!,
        },
      },
      priority: getPriorityFromHeader(map.core.header),
    } satisfies SyncMessage);
  },
);

test.skip("If we add a server peer, newly created coValues are auto-subscribed to", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  const node = new LocalNode(admin, session, Crypto);

  const group = node.createGroup();

  const [inRx, _inTx] = newQueuePair();
  const [outRx, outTx] = newQueuePair();
  const outRxQ = outRx[Symbol.asyncIterator]();

  node.syncManager.addPeer({
    id: "test",
    incoming: inRx,
    outgoing: outTx,
    role: "server",
    crashOnClose: true,
  });

  // expect((await outRxQ.next()).value).toMatchObject({
  //     action: "load",
  //     id: admin.id,
  // });
  expect((await outRxQ.next()).value).toMatchObject({
    action: "load",
    id: group.core.id,
  });

  const map = group.createMap();

  const mapSubscribeMsg = (await outRxQ.next()).value;

  expect(mapSubscribeMsg).toEqual({
    action: "load",
    ...map.core.knownState(),
  } satisfies SyncMessage);

  // expect((await outRxQ.next()).value).toMatchObject(admContEx(adminID));
  expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

  const mapContentMsg = (await outRxQ.next()).value;

  expect(mapContentMsg).toEqual({
    action: "content",
    id: map.core.id,
    header: map.core.header,
    new: {},
    priority: getPriorityFromHeader(map.core.header),
  } satisfies SyncMessage);
});

test.todo(
  "TODO: when receiving a subscribe response that is behind our optimistic state (due to already sent content), we ignore it",
);

test("When we connect a new server peer, we try to sync all existing coValues to it", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  const node = new LocalNode(admin, session, Crypto);

  const group = node.createGroup();

  const map = group.createMap();

  const [inRx, _inTx] = newQueuePair();
  const [outRx, outTx] = newQueuePair();
  const outRxQ = outRx[Symbol.asyncIterator]();

  node.syncManager.addPeer({
    id: "test",
    incoming: inRx,
    outgoing: outTx,
    role: "server",
    crashOnClose: true,
  });

  // const _adminSubscribeMessage = await outRxQ.next();
  const groupSubscribeMessage = (await outRxQ.next()).value;

  expect(groupSubscribeMessage).toEqual({
    action: "load",
    ...group.core.knownState(),
  } satisfies SyncMessage);

  const secondMessage = (await outRxQ.next()).value;

  expect(secondMessage).toEqual({
    action: "load",
    ...map.core.knownState(),
  } satisfies SyncMessage);
});

test("When receiving a subscribe with a known state that is ahead of our own, peers should respond with a corresponding subscribe response message", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  const node = new LocalNode(admin, session, Crypto);

  const group = node.createGroup();

  const map = group.createMap();

  const [inRx, inTx] = newQueuePair();
  const [outRx, outTx] = newQueuePair();
  const outRxQ = outRx[Symbol.asyncIterator]();

  node.syncManager.addPeer({
    id: "test",
    incoming: inRx,
    outgoing: outTx,
    role: "peer",
    crashOnClose: true,
  });

  await inTx.push({
    action: "load",
    id: map.core.id,
    header: true,
    sessions: {
      [node.currentSessionID]: 1,
    },
  });

  // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
  expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));
  const mapTellKnownState = (await outRxQ.next()).value;

  expect(mapTellKnownState).toEqual({
    action: "known",
    ...map.core.knownState(),
  } satisfies SyncMessage);
});

test.skip("When replaying creation and transactions of a coValue as new content, the receiving peer integrates this information", async () => {
  // TODO: this test is mostly correct but also slightly unrealistic, make sure we pass all messages back and forth as expected and then it should work
  const [admin, session] = randomAnonymousAccountAndSessionID();

  const node1 = new LocalNode(admin, session, Crypto);

  const group = node1.createGroup();

  const [inRx1, inTx1] = newQueuePair();
  const [outRx1, outTx1] = newQueuePair();
  const outRxQ1 = outRx1[Symbol.asyncIterator]();

  node1.syncManager.addPeer({
    id: "test2",
    incoming: inRx1,
    outgoing: outTx1,
    role: "server",
    crashOnClose: true,
  });

  const node2 = new LocalNode(
    admin,
    Crypto.newRandomSessionID(admin.id),
    Crypto,
  );

  const [inRx2, inTx2] = newQueuePair();
  const [outRx2, outTx2] = newQueuePair();
  const outRxQ2 = outRx2[Symbol.asyncIterator]();

  node2.syncManager.addPeer({
    id: "test1",
    incoming: inRx2,
    outgoing: outTx2,
    role: "client",
    crashOnClose: true,
  });

  const adminSubscribeMessage = (await outRxQ1.next()).value;
  expect(adminSubscribeMessage).toMatchObject({
    action: "load",
    id: admin.id,
  });
  const groupSubscribeMsg = (await outRxQ1.next()).value;
  expect(groupSubscribeMsg).toMatchObject({
    action: "load",
    id: group.core.id,
  });

  await inTx2.push(adminSubscribeMessage);
  await inTx2.push(groupSubscribeMsg);

  // const adminTellKnownStateMsg = (await outRxQ2.next()).value;
  // expect(adminTellKnownStateMsg).toMatchObject(admStateEx(admin.id));

  const groupTellKnownStateMsg = (await outRxQ2.next()).value;
  expect(groupTellKnownStateMsg).toMatchObject(groupStateEx(group));

  expect(
    node2.syncManager.peers["test1"]!.optimisticKnownStates.has(group.core.id),
  ).toBeDefined();

  // await inTx1.push(adminTellKnownStateMsg);
  await inTx1.push(groupTellKnownStateMsg);

  // const adminContentMsg = (await outRxQ1.next()).value;
  // expect(adminContentMsg).toMatchObject(admContEx(admin.id));

  const groupContentMsg = (await outRxQ1.next()).value;
  expect(groupContentMsg).toMatchObject(groupContentEx(group));

  // await inTx2.push(adminContentMsg);
  await inTx2.push(groupContentMsg);

  const map = group.createMap();

  const mapSubscriptionMsg = (await outRxQ1.next()).value;
  expect(mapSubscriptionMsg).toMatchObject({
    action: "load",
    id: map.core.id,
  });

  const mapNewContentMsg = (await outRxQ1.next()).value;
  expect(mapNewContentMsg).toEqual({
    action: "content",
    id: map.core.id,
    header: map.core.header,
    new: {},
    priority: getPriorityFromHeader(map.core.header),
  } satisfies SyncMessage);

  await inTx2.push(mapSubscriptionMsg);

  const mapTellKnownStateMsg = (await outRxQ2.next()).value;
  expect(mapTellKnownStateMsg).toEqual({
    action: "known",
    id: map.core.id,
    header: false,
    sessions: {},
  } satisfies SyncMessage);

  expect(node2.coValuesStore.get(map.core.id).state.type).toEqual("loading");

  await inTx2.push(mapNewContentMsg);

  map.set("hello", "world", "trusting");

  const mapEditMsg = (await outRxQ1.next()).value;

  await inTx2.push(mapEditMsg);

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(
    expectMap(node2.expectCoValueLoaded(map.core.id).getCurrentContent()).get(
      "hello",
    ),
  ).toEqual("world");
});

test.skip("When loading a coValue on one node, the server node it is requested from replies with all the necessary depended on coValues to make it work", async () => {
  /*
    // TODO: this test is mostly correct but also slightly unrealistic, make sure we pass all messages back and forth as expected and then it should work
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const node1 = new LocalNode(admin, session, Crypto);

    const group = node1.createGroup();

    const map = group.createMap();
    map.set("hello", "world", "trusting");

    const node2 = new LocalNode(admin, newRandomSessionID(admin.id), Crypto);

    const [node1asPeer, node2asPeer] = connectedPeers("peer1", "peer2");

    node1.syncManager.addPeer(node2asPeer);
    node2.syncManager.addPeer(node1asPeer);

    await node2.loadCoValueCore(map.core.id);

    expect(
        expectMap(
            node2.expectCoValueLoaded(map.core.id).getCurrentContent(),
        ).get("hello"),
    ).toEqual("world");
    */
});

test("Can sync a coValue through a server to another client", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();

  const client1 = new LocalNode(admin, session, Crypto);

  const group = client1.createGroup();

  const map = group.createMap();
  map.set("hello", "world", "trusting");

  const [serverUser, serverSession] = randomAnonymousAccountAndSessionID();

  const server = new LocalNode(serverUser, serverSession, Crypto);

  const [serverAsPeerForClient1, client1AsPeer] = connectedPeers(
    "serverFor1",
    "client1",
    {
      peer1role: "server",
      peer2role: "client",
      // trace: true,
    },
  );

  client1.syncManager.addPeer(serverAsPeerForClient1);
  server.syncManager.addPeer(client1AsPeer);

  const client2 = new LocalNode(
    admin,
    Crypto.newRandomSessionID(admin.id),
    Crypto,
  );

  const [serverAsPeerForClient2, client2AsPeer] = connectedPeers(
    "serverFor2",
    "client2",
    {
      peer1role: "server",
      peer2role: "client",
      // trace: true,
    },
  );

  client2.syncManager.addPeer(serverAsPeerForClient2);
  server.syncManager.addPeer(client2AsPeer);

  const mapOnClient2 = await client2.loadCoValueCore(map.core.id);
  if (mapOnClient2 === "unavailable") {
    throw new Error("Map is unavailable");
  }

  expect(expectMap(mapOnClient2.getCurrentContent()).get("hello")).toEqual(
    "world",
  );
});

test("Can sync a coValue with private transactions through a server to another client", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();

  const client1 = new LocalNode(admin, session, Crypto);

  const group = client1.createGroup();

  const map = group.createMap();
  map.set("hello", "world", "private");

  const [serverUser, serverSession] = randomAnonymousAccountAndSessionID();

  const server = new LocalNode(serverUser, serverSession, Crypto);

  const [serverAsPeer, client1AsPeer] = connectedPeers("server", "client1", {
    // trace: true,
    peer1role: "server",
    peer2role: "client",
  });

  client1.syncManager.addPeer(serverAsPeer);
  server.syncManager.addPeer(client1AsPeer);

  const client2 = new LocalNode(
    admin,
    client1.crypto.newRandomSessionID(admin.id),
    Crypto,
  );

  const [serverAsOtherPeer, client2AsPeer] = connectedPeers(
    "server",
    "client2",
    {
      // trace: true,
      peer1role: "server",
      peer2role: "client",
    },
  );

  client2.syncManager.addPeer(serverAsOtherPeer);
  server.syncManager.addPeer(client2AsPeer);

  const mapOnClient2 = await client2.loadCoValueCore(map.core.id);
  if (mapOnClient2 === "unavailable") {
    throw new Error("Map is unavailable");
  }

  expect(expectMap(mapOnClient2.getCurrentContent()).get("hello")).toEqual(
    "world",
  );
});

test.skip("When a peer's incoming/readable stream closes, we remove the peer", async () => {
  /*
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const [inRx, inTx] = await Effect.runPromise(newStreamPair());
    const [outRx, outTx] = await Effect.runPromise(newStreamPair());

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    // expect(yield* Queue.take(outRxQ)).toMatchObject({
    //     action: "load",
    //     id: admin.id,
    // });
    expect(yield * Queue.take(outRxQ)).toMatchObject({
        action: "load",
        id: group.core.id,
    });

    const map = group.createMap();

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "load",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect(yield* Queue.take(outRxQ)).toMatchObject(admContEx(admin.id));
    expect(yield * Queue.take(outRxQ)).toMatchObject(groupContentEx(group));

    const mapContentMsg = await reader.read();

    expect(mapContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    await inTx.abort();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(node.syncManager.peers["test"]).toBeUndefined();
    */
});

test.skip("When a peer's outgoing/writable stream closes, we remove the peer", async () => {
  /*
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const [inRx] = await Effect.runPromise(newStreamPair());
    const [outRx, outTx] = await Effect.runPromise(newStreamPair());

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    // expect(yield* Queue.take(outRxQ)).toMatchObject({
    //     action: "load",
    //     id: admin.id,
    // });
    expect(yield * Queue.take(outRxQ)).toMatchObject({
        action: "load",
        id: group.core.id,
    });

    const map = group.createMap();

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "load",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect(yield* Queue.take(outRxQ)).toMatchObject(admContEx(admin.id));
    expect(yield * Queue.take(outRxQ)).toMatchObject(groupContentEx(group));

    const mapContentMsg = await reader.read();

    expect(mapContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    reader.releaseLock();
    await outRx.cancel();

    map.set("hello", "world", "trusting");

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(node.syncManager.peers["test"]).toBeUndefined();
    */
});

test("If we start loading a coValue before connecting to a peer that has it, it will load it once we connect", async () => {
  const [admin, session] = randomAnonymousAccountAndSessionID();

  const node1 = new LocalNode(admin, session, Crypto);

  const group = node1.createGroup();

  const map = group.createMap();
  map.set("hello", "world", "trusting");

  const node2 = new LocalNode(
    admin,
    Crypto.newRandomSessionID(admin.id),
    Crypto,
  );

  const [node1asPeer, node2asPeer] = connectedPeers("peer1", "peer2", {
    peer1role: "server",
    peer2role: "client",
    // trace: true,
  });

  node1.syncManager.addPeer(node2asPeer);

  const mapOnNode2Promise = node2.loadCoValueCore(map.core.id);

  expect(node2.coValuesStore.get(map.core.id).state.type).toEqual("unknown");

  node2.syncManager.addPeer(node1asPeer);

  const mapOnNode2 = await mapOnNode2Promise;
  if (mapOnNode2 === "unavailable") {
    throw new Error("Map is unavailable");
  }

  expect(expectMap(mapOnNode2.getCurrentContent()).get("hello")).toEqual(
    "world",
  );
});

test("should keep the peer state when the peer closes", async () => {
  const {
    client,
    jazzCloud,
    jazzCloudConnectionAsPeer,
    connectionWithClientAsPeer,
  } = createTwoConnectedNodes();

  const group = jazzCloud.createGroup();
  const map = group.createMap();
  map.set("hello", "world", "trusting");

  await client.loadCoValueCore(map.core.id);

  const syncManager = client.syncManager;
  const peerState = syncManager.peers[jazzCloudConnectionAsPeer.id];

  // @ts-expect-error Simulating a peer closing, leveraging the direct connection between the client/server peers
  await connectionWithClientAsPeer.outgoing.push("Disconnected");

  await waitFor(() => peerState?.closed);

  expect(syncManager.peers[jazzCloudConnectionAsPeer.id]).not.toBeUndefined();
});

test("should delete the peer state when the peer closes if deletePeerStateOnClose is true", async () => {
  const {
    client,
    jazzCloud,
    jazzCloudConnectionAsPeer,
    connectionWithClientAsPeer,
  } = createTwoConnectedNodes();

  jazzCloudConnectionAsPeer.deletePeerStateOnClose = true;

  const group = jazzCloud.createGroup();
  const map = group.createMap();
  map.set("hello", "world", "trusting");

  await client.loadCoValueCore(map.core.id);

  const syncManager = client.syncManager;

  const peerState = syncManager.peers[jazzCloudConnectionAsPeer.id];

  // @ts-expect-error Simulating a peer closing, leveraging the direct connection between the client/server peers
  await connectionWithClientAsPeer.outgoing.push("Disconnected");

  await waitFor(() => peerState?.closed);

  expect(syncManager.peers[jazzCloudConnectionAsPeer.id]).toBeUndefined();
});

describe("sync - extra tests", () => {
  test("Node handles disconnection and reconnection of a peer gracefully", async () => {
    // Create two nodes
    const [admin1, session1] = randomAnonymousAccountAndSessionID();
    const node1 = new LocalNode(admin1, session1, Crypto);

    const [admin2, session2] = randomAnonymousAccountAndSessionID();
    const node2 = new LocalNode(admin2, session2, Crypto);

    // Create a group and a map on node1
    const group = node1.createGroup();
    group.addMember("everyone", "writer");
    const map = group.createMap();
    map.set("key1", "value1", "trusting");

    // Connect the nodes
    const [node1AsPeer, node2AsPeer] = connectedPeers("node1", "node2", {
      peer1role: "server",
      peer2role: "client",
    });

    node1.syncManager.addPeer(node2AsPeer);
    node2.syncManager.addPeer(node1AsPeer);

    // Wait for initial sync
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify that node2 has received the map
    const mapOnNode2 = await node2.loadCoValueCore(map.core.id);
    if (mapOnNode2 === "unavailable") {
      throw new Error("Map is unavailable on node2");
    }

    expect(expectMap(mapOnNode2.getCurrentContent()).get("key1")).toEqual(
      "value1",
    );

    // Simulate disconnection
    node1.syncManager.gracefulShutdown();
    node2.syncManager.gracefulShutdown();

    // Make changes on node1 while disconnected
    map.set("key2", "value2", "trusting");

    // Simulate reconnection
    const [newNode1AsPeer, newNode2AsPeer] = connectedPeers(
      "node11",
      "node22",
      {
        peer1role: "server",
        peer2role: "client",
        // trace: true,
      },
    );

    node1.syncManager.addPeer(newNode2AsPeer);
    node2.syncManager.addPeer(newNode1AsPeer);

    // Wait for re-sync
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify that node2 has received the changes made during disconnection
    const updatedMapOnNode2 = await node2.loadCoValueCore(map.core.id);
    if (updatedMapOnNode2 === "unavailable") {
      throw new Error("Updated map is unavailable on node2");
    }

    expect(
      expectMap(updatedMapOnNode2.getCurrentContent()).get("key2"),
    ).toEqual("value2");

    // Make a new change on node2 to verify two-way sync
    const mapOnNode2ForEdit = await node2.loadCoValueCore(map.core.id);
    if (mapOnNode2ForEdit === "unavailable") {
      throw new Error("Updated map is unavailable on node2");
    }

    const success = mapOnNode2ForEdit.makeTransaction(
      [
        {
          op: "set",
          key: "key3",
          value: "value3",
        },
      ],
      "trusting",
    );

    if (!success) {
      throw new Error("Failed to make transaction");
    }

    // Wait for sync back to node1
    await new Promise((resolve) => setTimeout(resolve, 100));

    const mapOnNode1 = await node1.loadCoValueCore(map.core.id);
    if (mapOnNode1 === "unavailable") {
      throw new Error("Updated map is unavailable on node1");
    }

    // Verify that node1 has received the change from node2
    expect(expectMap(mapOnNode1.getCurrentContent()).get("key3")).toEqual(
      "value3",
    );
  });
  test("Concurrent modifications on multiple nodes are resolved correctly", async () => {
    // Create three nodes
    const [admin1, session1] = randomAnonymousAccountAndSessionID();
    const node1 = new LocalNode(admin1, session1, Crypto);

    const [admin2, session2] = randomAnonymousAccountAndSessionID();
    const node2 = new LocalNode(admin2, session2, Crypto);

    const [admin3, session3] = randomAnonymousAccountAndSessionID();
    const node3 = new LocalNode(admin3, session3, Crypto);

    // Create a group and a map on node1
    const group = node1.createGroup();
    group.addMember("everyone", "writer");
    const map = group.createMap();

    // Connect the nodes in a triangle topology
    const [node1AsPeerFor2, node2AsPeerFor1] = connectedPeers(
      "node1",
      "node2",
      {
        peer1role: "server",
        peer2role: "client",
        // trace: true,
      },
    );

    const [node2AsPeerFor3, node3AsPeerFor2] = connectedPeers(
      "node2",
      "node3",
      {
        peer1role: "server",
        peer2role: "client",
        // trace: true,
      },
    );

    const [node3AsPeerFor1, node1AsPeerFor3] = connectedPeers(
      "node3",
      "node1",
      {
        peer1role: "server",
        peer2role: "client",
        // trace: true,
      },
    );

    node1.syncManager.addPeer(node2AsPeerFor1);
    node1.syncManager.addPeer(node3AsPeerFor1);
    node2.syncManager.addPeer(node1AsPeerFor2);
    node2.syncManager.addPeer(node3AsPeerFor2);
    node3.syncManager.addPeer(node1AsPeerFor3);
    node3.syncManager.addPeer(node2AsPeerFor3);

    // Wait for initial sync
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify that all nodes have the map
    const mapOnNode1 = await node1.loadCoValueCore(map.core.id);
    const mapOnNode2 = await node2.loadCoValueCore(map.core.id);
    const mapOnNode3 = await node3.loadCoValueCore(map.core.id);

    if (
      mapOnNode1 === "unavailable" ||
      mapOnNode2 === "unavailable" ||
      mapOnNode3 === "unavailable"
    ) {
      throw new Error("Map is unavailable on node2 or node3");
    }

    // Perform concurrent modifications
    map.set("key1", "value1", "trusting");
    new RawCoMap(mapOnNode2).set("key2", "value2", "trusting");
    new RawCoMap(mapOnNode3).set("key3", "value3", "trusting");

    // Wait for sync to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify that all nodes have the same final state
    const finalStateNode1 = expectMap(mapOnNode1.getCurrentContent());
    const finalStateNode2 = expectMap(mapOnNode2.getCurrentContent());
    const finalStateNode3 = expectMap(mapOnNode3.getCurrentContent());

    const expectedState = {
      key1: "value1",
      key2: "value2",
      key3: "value3",
    };

    expect(finalStateNode1.toJSON()).toEqual(expectedState);
    expect(finalStateNode2.toJSON()).toEqual(expectedState);
    expect(finalStateNode3.toJSON()).toEqual(expectedState);
  });
  test.skip("Large coValues are synced efficiently in chunks", async () => {
    // Create two nodes
    const [admin1, session1] = randomAnonymousAccountAndSessionID();
    const node1 = new LocalNode(admin1, session1, Crypto);

    const [admin2, session2] = randomAnonymousAccountAndSessionID();
    const node2 = new LocalNode(admin2, session2, Crypto);

    // Create a group and a large map on node1
    const group = node1.createGroup();
    group.addMember("everyone", "writer");
    const largeMap = group.createMap();

    // Generate a large amount of data (about 10MB)
    const dataSize = 1 * 1024 * 1024;
    const chunkSize = 1024; // 1KB chunks
    const chunks = dataSize / chunkSize;

    for (let i = 0; i < chunks; i++) {
      const key = `key${i}`;
      const value = Buffer.alloc(chunkSize, `value${i}`).toString("base64");
      largeMap.set(key, value, "trusting");
    }

    // Connect the nodes
    const [node1AsPeer, node2AsPeer] = connectedPeers("node1", "node2", {
      peer1role: "server",
      peer2role: "client",
    });

    node1.syncManager.addPeer(node2AsPeer);
    node2.syncManager.addPeer(node1AsPeer);

    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Measure sync time
    const startSync = performance.now();

    // Load the large map on node2
    const largeMapOnNode2 = await node2.loadCoValueCore(largeMap.core.id);
    if (largeMapOnNode2 === "unavailable") {
      throw new Error("Large map is unavailable on node2");
    }

    const endSync = performance.now();
    const syncTime = endSync - startSync;

    // Verify that all data was synced correctly
    const syncedMap = new RawCoMap(largeMapOnNode2);
    expect(
      Object.keys(largeMapOnNode2.getCurrentContent().toJSON() || {}).length,
    ).toBe(chunks);

    for (let i = 0; i < chunks; i++) {
      const key = `key${i}`;
      const expectedValue = Buffer.alloc(chunkSize, `value${i}`).toString(
        "base64",
      );
      expect(syncedMap.get(key)).toBe(expectedValue);
    }

    // Check that sync time is reasonable (this threshold may need adjustment)
    const reasonableSyncTime = 10; // 30 seconds
    expect(syncTime).toBeLessThan(reasonableSyncTime);

    // Check memory usage (this threshold may need adjustment)
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // in MB
    const reasonableMemoryUsage = 1; // 500 MB
    expect(memoryUsage).toBeLessThan(reasonableMemoryUsage);
  });

  test("Node correctly handles and recovers from network partitions", async () => {
    // Create three nodes
    const [admin1, session1] = randomAnonymousAccountAndSessionID();
    const node1 = new LocalNode(admin1, session1, Crypto);

    const [admin2, session2] = randomAnonymousAccountAndSessionID();
    const node2 = new LocalNode(admin2, session2, Crypto);

    const [admin3, session3] = randomAnonymousAccountAndSessionID();
    const node3 = new LocalNode(admin3, session3, Crypto);

    // Create a group and a map on node1
    const group = node1.createGroup();
    group.addMember("everyone", "writer");
    const map = group.createMap();
    map.set("initial", "value", "trusting");

    // Connect all nodes
    const [node1AsPeerFor2, node2AsPeerFor1] = connectedPeers(
      "node1",
      "node2",
      {
        peer1role: "server",
        peer2role: "client",
        // trace: true,
      },
    );

    const [node2AsPeerFor3, node3AsPeerFor2] = connectedPeers(
      "node2",
      "node3",
      {
        peer1role: "server",
        peer2role: "client",
        // trace: true,
      },
    );

    const [node3AsPeerFor1, node1AsPeerFor3] = connectedPeers(
      "node3",
      "node1",
      {
        peer1role: "server",
        peer2role: "client",
        // trace: true,
      },
    );

    node1.syncManager.addPeer(node2AsPeerFor1);
    node1.syncManager.addPeer(node3AsPeerFor1);
    node2.syncManager.addPeer(node1AsPeerFor2);
    node2.syncManager.addPeer(node3AsPeerFor2);
    node3.syncManager.addPeer(node1AsPeerFor3);
    node3.syncManager.addPeer(node2AsPeerFor3);

    // Wait for initial sync
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify initial state
    const mapOnNode1Core = await node1.loadCoValueCore(map.core.id);
    const mapOnNode2Core = await node2.loadCoValueCore(map.core.id);
    const mapOnNode3Core = await node3.loadCoValueCore(map.core.id);

    if (
      mapOnNode1Core === "unavailable" ||
      mapOnNode2Core === "unavailable" ||
      mapOnNode3Core === "unavailable"
    ) {
      throw new Error("Map is unavailable on node2 or node3");
    }

    // const mapOnNode1 = new RawCoMap(mapOnNode1Core);
    const mapOnNode2 = new RawCoMap(mapOnNode2Core);
    const mapOnNode3 = new RawCoMap(mapOnNode3Core);

    expect(mapOnNode2.get("initial")).toBe("value");
    expect(mapOnNode3.get("initial")).toBe("value");

    // Simulate network partition: disconnect node3 from node1 and node2
    node1.syncManager.peers["node3"]?.gracefulShutdown();
    delete node1.syncManager.peers["node3"];
    node2.syncManager.peers["node3"]?.gracefulShutdown();
    delete node2.syncManager.peers["node3"];
    node3.syncManager.peers["node1"]?.gracefulShutdown();
    delete node3.syncManager.peers["node1"];
    node3.syncManager.peers["node2"]?.gracefulShutdown();
    delete node3.syncManager.peers["node2"];

    // Make changes on both sides of the partition
    map.set("node1", "partition", "trusting");
    mapOnNode2.set("node2", "partition", "trusting");
    mapOnNode3.set("node3", "partition", "trusting");

    // Wait for sync between node1 and node2
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify that node1 and node2 are in sync, but node3 is not
    expect(expectMap(mapOnNode1Core.getCurrentContent()).get("node1")).toBe(
      "partition",
    );
    expect(expectMap(mapOnNode1Core.getCurrentContent()).get("node2")).toBe(
      "partition",
    );
    expect(expectMap(mapOnNode1Core.getCurrentContent()).toJSON()?.node3).toBe(
      undefined,
    );

    expect(expectMap(mapOnNode2Core.getCurrentContent()).get("node1")).toBe(
      "partition",
    );
    expect(expectMap(mapOnNode2Core.getCurrentContent()).get("node2")).toBe(
      "partition",
    );
    expect(expectMap(mapOnNode2Core.getCurrentContent()).toJSON()?.node3).toBe(
      undefined,
    );

    expect(expectMap(mapOnNode3Core.getCurrentContent()).toJSON()?.node1).toBe(
      undefined,
    );
    expect(expectMap(mapOnNode3Core.getCurrentContent()).toJSON()?.node2).toBe(
      undefined,
    );

    expect(expectMap(mapOnNode3Core.getCurrentContent()).toJSON()?.node3).toBe(
      "partition",
    );

    // Restore connectivity
    const [newNode3AsPeerFor1, newNode1AsPeerFor3] = connectedPeers(
      "node3",
      "node1",
      {
        peer1role: "server",
        peer2role: "client",
        // trace: true,
      },
    );

    const [newNode3AsPeerFor2, newNode2AsPeerFor3] = connectedPeers(
      "node3",
      "node2",
      {
        peer1role: "server",
        peer2role: "client",
        // trace: true,
      },
    );

    node1.syncManager.addPeer(newNode3AsPeerFor1);
    node2.syncManager.addPeer(newNode3AsPeerFor2);
    node3.syncManager.addPeer(newNode1AsPeerFor3);
    node3.syncManager.addPeer(newNode2AsPeerFor3);

    // Wait for re-sync
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify final state: all nodes should have all changes
    const finalStateNode1 = expectMap(
      mapOnNode1Core.getCurrentContent(),
    ).toJSON();
    const finalStateNode2 = expectMap(
      mapOnNode2Core.getCurrentContent(),
    ).toJSON();
    const finalStateNode3 = expectMap(
      mapOnNode3Core.getCurrentContent(),
    ).toJSON();

    const expectedFinalState = {
      initial: "value",
      node1: "partition",
      node2: "partition",
      node3: "partition",
    };

    expect(finalStateNode1).toEqual(expectedFinalState);
    expect(finalStateNode2).toEqual(expectedFinalState);
    expect(finalStateNode3).toEqual(expectedFinalState);
  });
});

function createTwoConnectedNodes() {
  // Setup nodes
  const client = createTestNode();
  const jazzCloud = createTestNode();

  // Connect nodes initially
  const [connectionWithClientAsPeer, jazzCloudConnectionAsPeer] =
    connectedPeers("connectionWithClient", "jazzCloudConnection", {
      peer1role: "client",
      peer2role: "server",
    });

  client.syncManager.addPeer(jazzCloudConnectionAsPeer);
  jazzCloud.syncManager.addPeer(connectionWithClientAsPeer);

  return {
    client,
    jazzCloud,
    connectionWithClientAsPeer,
    jazzCloudConnectionAsPeer,
  };
}

describe("SyncManager - knownStates vs optimisticKnownStates", () => {
  test("knownStates and optimisticKnownStates are the same when the coValue is fully synced", async () => {
    const { client, jazzCloud } = createTwoConnectedNodes();

    // Create test data
    const group = client.createGroup();
    const mapOnClient = group.createMap();
    mapOnClient.set("key1", "value1", "trusting");

    await client.syncManager.actuallySyncCoValue(mapOnClient.core);

    // Wait for the full sync to complete
    await mapOnClient.core.waitForSync();

    const peerStateClient = client.syncManager.peers["jazzCloudConnection"]!;
    const peerStateJazzCloud =
      jazzCloud.syncManager.peers["connectionWithClient"]!;

    // The optimisticKnownStates should be the same as the knownStates after the full sync is complete
    expect(
      peerStateClient.optimisticKnownStates.get(mapOnClient.core.id),
    ).toEqual(peerStateClient.knownStates.get(mapOnClient.core.id));

    // On the other node the knownStates should be updated correctly based on the messages we received
    expect(
      peerStateJazzCloud.optimisticKnownStates.get(mapOnClient.core.id),
    ).toEqual(peerStateJazzCloud.knownStates.get(mapOnClient.core.id));
  });

  test("optimisticKnownStates is updated as new transactions are sent, while knownStates only when the updates are acknowledged", async () => {
    const { client, jazzCloudConnectionAsPeer } = createTwoConnectedNodes();

    // Create test data and sync the first change
    // We want that both the nodes know about the coValue so we can test
    // the content acknowledgement flow.
    const group = client.createGroup();
    const map = group.createMap();
    map.set("key1", "value1", "trusting");

    await client.syncManager.actuallySyncCoValue(map.core);
    await map.core.waitForSync();

    // Block the content messages
    // The main difference between optimisticKnownStates and knownStates is that
    // optimisticKnownStates is updated when the content messages are sent,
    // while knownStates is only updated when we receive the "known" messages
    // that are acknowledging the receipt of the content messages
    const outgoing = blockMessageTypeOnOutgoingPeer(
      jazzCloudConnectionAsPeer,
      "content",
    );

    map.set("key2", "value2", "trusting");

    await client.syncManager.actuallySyncCoValue(map.core);

    const peerState = client.syncManager.peers["jazzCloudConnection"]!;

    expect(peerState.optimisticKnownStates.get(map.core.id)).not.toEqual(
      peerState.knownStates.get(map.core.id),
    );

    // Restore the implementation of push and send the blocked messages
    // After this the full sync can be completed and the other node will
    // respond with a "known" message acknowledging the receipt of the content messages
    outgoing.unblock();
    await outgoing.sendBlockedMessages();

    await map.core.waitForSync();

    expect(peerState.optimisticKnownStates.get(map.core.id)).toEqual(
      peerState.knownStates.get(map.core.id),
    );
  });
});

describe("SyncManager.addPeer", () => {
  test("new peer gets a copy of previous peer's knownStates when replacing it", async () => {
    const { client } = createTwoConnectedNodes();

    // Create test data
    const group = client.createGroup();
    const map = group.createMap();
    map.set("key1", "value1", "trusting");

    await client.syncManager.actuallySyncCoValue(map.core);

    // Wait for initial sync
    await map.core.waitForSync();

    // Store the initial known states
    const initialKnownStates =
      client.syncManager.peers["jazzCloudConnection"]!.knownStates;

    // Create new connection with same ID
    const [jazzCloudConnectionAsPeer2] = connectedPeers(
      "jazzCloudConnection",
      "unusedPeer",
      {
        peer1role: "server",
        peer2role: "client",
      },
    );

    // Add new peer with same ID
    client.syncManager.addPeer(jazzCloudConnectionAsPeer2);

    // Verify that the new peer has a copy of the previous known states
    const newPeerKnownStates =
      client.syncManager.peers["jazzCloudConnection"]!.knownStates;

    expect(newPeerKnownStates).not.toBe(initialKnownStates); // Should be a different instance
    expect(newPeerKnownStates.get(map.core.id)).toEqual(
      initialKnownStates.get(map.core.id),
    );
  });

  test("new peer with new ID starts with empty knownStates", async () => {
    const { client } = createTwoConnectedNodes();

    // Create test data
    const group = client.createGroup();
    const map = group.createMap();
    map.set("key1", "value1", "trusting");

    await client.syncManager.actuallySyncCoValue(map.core);

    // Wait for initial sync
    await map.core.waitForSync();

    // Connect second peer with different ID
    const [brandNewPeer] = connectedPeers("brandNewPeer", "unusedPeer", {
      peer1role: "client",
      peer2role: "server",
    });

    // Add new peer with different ID
    client.syncManager.addPeer(brandNewPeer);

    // Verify that the new peer starts with empty known states
    const newPeerKnownStates =
      client.syncManager.peers["brandNewPeer"]!.knownStates;
    expect(newPeerKnownStates.get(map.core.id)).toBe(undefined);
  });

  test("when adding a peer with the same ID as a previous peer, the previous peer is closed", async () => {
    const { client } = createTwoConnectedNodes();

    // Store reference to first peer
    const firstPeer = client.syncManager.peers["jazzCloudConnection"]!;
    const closeSpy = vi.spyOn(firstPeer, "gracefulShutdown");

    // Create and add replacement peer
    const [jazzCloudConnectionAsPeer2] = connectedPeers(
      "jazzCloudConnection",
      "unusedPeer",
      {
        peer1role: "server",
        peer2role: "client",
      },
    );

    client.syncManager.addPeer(jazzCloudConnectionAsPeer2);

    // Verify thet the first peer had ben closed correctly
    expect(closeSpy).toHaveBeenCalled();
    expect(firstPeer.closed).toBe(true);
  });

  test("when adding a peer with the same ID as a previous peer and the previous peer is closed, do not attempt to close it again", async () => {
    const { client } = createTwoConnectedNodes();

    // Store reference to first peer
    const firstPeer = client.syncManager.peers["jazzCloudConnection"]!;

    firstPeer.gracefulShutdown();
    const closeSpy = vi.spyOn(firstPeer, "gracefulShutdown");

    // Create and add replacement peer
    const [jazzCloudConnectionAsPeer2] = connectedPeers(
      "jazzCloudConnection",
      "unusedPeer",
      {
        peer1role: "server",
        peer2role: "client",
      },
    );

    client.syncManager.addPeer(jazzCloudConnectionAsPeer2);

    // Verify thet the first peer had not been closed again
    expect(closeSpy).not.toHaveBeenCalled();
    expect(firstPeer.closed).toBe(true);
  });

  test("when adding a server peer the local coValues should be sent to it", async () => {
    // Setup nodes
    const client = createTestNode();
    const jazzCloud = createTestNode();

    // Connect nodes initially
    const [connectionWithClientAsPeer, jazzCloudConnectionAsPeer] =
      connectedPeers("connectionWithClient", "jazzCloudConnection", {
        peer1role: "client",
        peer2role: "server",
      });

    jazzCloud.syncManager.addPeer(connectionWithClientAsPeer);

    const group = client.createGroup();
    const map = group.createMap();
    map.set("key1", "value1", "trusting");

    client.syncManager.addPeer(jazzCloudConnectionAsPeer);

    await map.core.waitForSync();

    expect(jazzCloud.coValuesStore.get(map.id).state.type).toBe("available");
  });
});

describe("loadCoValueCore with retry", () => {
  test("should load the value if available on the server", async () => {
    const { client, jazzCloud } = createTwoConnectedNodes();

    const anotherClient = createTestNode();
    const [
      connectionWithAnotherClientAsPeer,
      jazzCloudConnectionAsPeerForAnotherClient,
    ] = connectedPeers("connectionWithAnotherClient", "jazzCloudConnection", {
      peer1role: "client",
      peer2role: "server",
    });

    jazzCloud.syncManager.addPeer(connectionWithAnotherClientAsPeer);

    const group = anotherClient.createGroup();
    const map = group.createMap();
    map.set("key1", "value1", "trusting");

    const promise = client.loadCoValueCore(map.id);

    anotherClient.syncManager.addPeer(
      jazzCloudConnectionAsPeerForAnotherClient,
    );
    await expect(promise).resolves.not.toBe("unavailable");
  });

  test("should handle correctly two subsequent loads", async () => {
    const { client, jazzCloud } = createTwoConnectedNodes();

    const anotherClient = createTestNode();
    const [
      connectionWithAnotherClientAsPeer,
      jazzCloudConnectionAsPeerForAnotherClient,
    ] = connectedPeers("connectionWithAnotherClient", "jazzCloudConnection", {
      peer1role: "client",
      peer2role: "server",
    });

    jazzCloud.syncManager.addPeer(connectionWithAnotherClientAsPeer);

    const group = anotherClient.createGroup();
    const map = group.createMap();
    map.set("key1", "value1", "trusting");

    const promise1 = client.loadCoValueCore(map.id);
    const promise2 = client.loadCoValueCore(map.id);

    anotherClient.syncManager.addPeer(
      jazzCloudConnectionAsPeerForAnotherClient,
    );

    await expect(promise1).resolves.not.toBe("unavailable");
    await expect(promise2).resolves.not.toBe("unavailable");
  });
});

describe("waitForSyncWithPeer", () => {
  test("should resolve when the coValue is fully uploaded into the peer", async () => {
    const { client, jazzCloudConnectionAsPeer: peer } =
      createTwoConnectedNodes();

    // Create test data
    const group = client.createGroup();
    const map = group.createMap();
    map.set("key1", "value1", "trusting");

    await client.syncManager.actuallySyncCoValue(map.core);

    await expect(
      client.syncManager.waitForSyncWithPeer(peer.id, map.core.id, 100),
    ).resolves.toBe(true);
  });

  test("should not resolve when the coValue is not synced", async () => {
    const { client, jazzCloudConnectionAsPeer: peer } =
      createTwoConnectedNodes();

    // Create test data
    const group = client.createGroup();
    const map = group.createMap();
    map.set("key1", "value1", "trusting");

    vi.spyOn(peer.outgoing, "push").mockImplementation(async () => {
      return Promise.resolve();
    });

    await client.syncManager.actuallySyncCoValue(map.core);

    await expect(
      client.syncManager.waitForSyncWithPeer(peer.id, map.core.id, 100),
    ).rejects.toThrow("Timeout");
  });
});

function groupContentEx(group: RawGroup) {
  return {
    action: "content",
    id: group.core.id,
  };
}

function _admContEx(adminID: RawAccountID) {
  return {
    action: "content",
    id: adminID,
  };
}

function groupStateEx(group: RawGroup) {
  return {
    action: "known",
    id: group.core.id,
  };
}

function _admStateEx(adminID: RawAccountID) {
  return {
    action: "known",
    id: adminID,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
