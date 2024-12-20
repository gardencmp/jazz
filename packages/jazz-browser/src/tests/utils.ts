import { CoID, LocalNode, RawCoValue } from "cojson";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { Account, WasmCrypto } from "jazz-tools";

const Crypto = await WasmCrypto.create();

export async function setupTwoNodes() {
  const [serverAsPeer, clientAsPeer] = connectedPeers(
    "clientToServer",
    "serverToClient",
    {
      peer1role: "server",
      peer2role: "client",
    },
  );

  const client = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [serverAsPeer],
    crypto: Crypto,
    creationProps: { name: "Client" },
    migration: async (rawAccount, _node, creationProps) => {
      const account = new Account({
        fromRaw: rawAccount,
      });

      await account.migrate?.(creationProps);
    },
  });

  const server = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [clientAsPeer],
    crypto: Crypto,
    creationProps: { name: "Server" },
    migration: async (rawAccount, _node, creationProps) => {
      const account = new Account({
        fromRaw: rawAccount,
      });

      await account.migrate?.(creationProps);
    },
  });

  return {
    clientNode: client.node,
    serverNode: server.node,
    clientAccount: Account.fromRaw(
      await loadCoValueOrFail(client.node, client.accountID),
    ),
    serverAccount: Account.fromRaw(
      await loadCoValueOrFail(server.node, server.accountID),
    ),
  };
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
