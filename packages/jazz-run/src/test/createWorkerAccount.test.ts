import { LocalNode } from "cojson";
import { createWebSocketPeer } from "cojson-transport-ws";
import { WasmCrypto } from "jazz-tools";
import { describe, expect, it, onTestFinished } from "vitest";
import { WebSocket } from "ws";
import { createWorkerAccount } from "../createWorkerAccount.js";
import { startSyncServer } from "../startSyncServer.js";

describe("createWorkerAccount - integration tests", () => {
  it("should create a worker account using the local sync server", async () => {
    // Pass port: undefined to let the server choose a random port
    const server = await startSyncServer({
      port: undefined,
      inMemory: true,
      db: "",
    });

    onTestFinished(() => {
      server.close();
    });

    const address = server.address();

    if (typeof address !== "object" || address === null) {
      throw new Error("Server address is not an object");
    }

    const { accountID, agentSecret } = await createWorkerAccount({
      name: "test",
      peer: `ws://localhost:${address.port}`,
    });

    expect(accountID).toBeDefined();
    expect(agentSecret).toBeDefined();

    const peer = createWebSocketPeer({
      id: "upstream",
      websocket: new WebSocket(`ws://localhost:${address.port}`),
      role: "server",
    });

    const crypto = await WasmCrypto.create();
    const { node } = await LocalNode.withNewlyCreatedAccount({
      creationProps: { name: "test" },
      peersToLoadFrom: [peer],
      crypto,
    });

    expect(await node.load(accountID as any)).not.toBe("unavailable");
  });

  it("should create a worker account using the Jazz cloud", async () => {
    const { accountID, agentSecret } = await createWorkerAccount({
      name: "test",
      peer: `wss://cloud.jazz.tools`,
    });

    expect(accountID).toBeDefined();
    expect(agentSecret).toBeDefined();

    const peer = createWebSocketPeer({
      id: "upstream",
      websocket: new WebSocket(`wss://cloud.jazz.tools`),
      role: "server",
    });

    const crypto = await WasmCrypto.create();
    const { node } = await LocalNode.withNewlyCreatedAccount({
      creationProps: { name: "test" },
      peersToLoadFrom: [peer],
      crypto,
    });

    expect(await node.load(accountID as any)).not.toBe("unavailable");
  });
});
