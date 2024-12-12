import { Peer } from "cojson";
import { createWebSocketPeer } from "cojson-transport-ws";
import { createWorkerAccount } from "jazz-run/createWorkerAccount";
import { startSyncServer } from "jazz-run/startSyncServer";
import { CoMap, Group, co } from "jazz-tools";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { WebSocket } from "ws";
import { startWorker } from "../index";

async function setup() {
  const { server, port } = await setupSyncServer();

  const syncServer = `ws://localhost:${port}`;

  const { worker, done } = await setupWorker(syncServer);

  return { worker, done, syncServer, server, port };
}

async function setupSyncServer(defaultPort = "0") {
  const server = await startSyncServer({
    port: defaultPort,
    inMemory: true,
    db: "",
  });

  const port = (server.address() as { port: number }).port.toString();

  onTestFinished(() => {
    server.close();
  });

  return { server, port };
}

async function setupWorker(syncServer: string) {
  const { accountId, agentSecret } = await createWorkerAccount({
    name: "test-worker",
    peer: syncServer,
  });

  return startWorker({
    accountID: accountId,
    accountSecret: agentSecret,
    syncServer,
  });
}

class TestMap extends CoMap {
  value = co.string;
}

describe("startWorker integration", () => {
  test("worker connects to sync server successfully", async () => {
    const worker1 = await setup();
    const worker2 = await setupWorker(worker1.syncServer);

    const group = Group.create({ owner: worker1.worker });
    group.addMember("everyone", "reader");

    const map = TestMap.create(
      {
        value: "test",
      },
      { owner: group },
    );

    await map.waitForSync();

    const mapOnWorker2 = await TestMap.load(map.id, worker2.worker, {});

    expect(mapOnWorker2?.value).toBe("test");

    await worker1.done();
    await worker2.done();
  });

  test("waits for all coValues to sync before resolving done", async () => {
    const worker1 = await setup();

    const group = Group.create({ owner: worker1.worker });
    group.addMember("everyone", "reader");

    const map = TestMap.create(
      {
        value: "test",
      },
      { owner: group },
    );

    await worker1.done();

    const worker2 = await setupWorker(worker1.syncServer);

    const mapOnWorker2 = await TestMap.load(map.id, worker2.worker, {});

    expect(mapOnWorker2?.value).toBe("test");

    await worker2.done();
  });
});
