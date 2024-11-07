import { describe, expect, it, onTestFinished } from "vitest";
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

    const { accountId, agentSecret } = await createWorkerAccount({
      name: "test",
      peer: `ws://localhost:${address.port}`,
    });

    expect(accountId).toBeDefined();
    expect(agentSecret).toBeDefined();
  });

  it("should create a worker account using the Jazz cloud", async () => {
    const { accountId, agentSecret } = await createWorkerAccount({
      name: "test",
      peer: `wss://cloud.jazz.tools`,
    });

    expect(accountId).toBeDefined();
    expect(agentSecret).toBeDefined();
  });
});
