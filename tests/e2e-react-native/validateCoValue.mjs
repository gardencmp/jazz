import { LocalNode, WasmCrypto } from "cojson";
import { createWebSocketPeer } from "cojson-transport-ws";
import { WebSocket } from "ws";

const invite = process.argv[2];

const [id, inviteSecret] = invite.replace("/invite/", "").split("/");

const { node, account } = await createLocalNode();

console.log("accepting invite id:", id, "secret:", inviteSecret);
await account.acceptInvite(id, inviteSecret);
console.log("invite accepted");

const coValue = await node.load(id);

if (coValue === "unavailable") {
  throw new Error("CoValue unavailable");
}

const coMap = coValue.core.getCurrentContent();

if (coMap.get("text") !== "Updated from React Native") {
  throw new Error(
    "CoMap text is not 'Updated from React Native' but '" +
      coMap.get("text") +
      "' ❌",
  );
} else {
  console.log("CoMap text is 'Updated from React Native' ✅");
}

coMap.set("text", "Updated from Node.js ✅");

console.log("CoMap text updated to 'Updated from Node.js' ✅");

await new Promise((resolve) => setTimeout(resolve, 1000));

await node.gracefulShutdown();

async function createLocalNode() {
  const crypto = await WasmCrypto.create();
  const ws = new WebSocket(
    "wss://cloud.jazz.tools/?key=e2e-rn-from-nodejs@garden.co",
  );

  const node = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [
      createWebSocketPeer({
        id: "peer:upstream-server",
        role: "server",
        websocket: ws,
        batchingByDefault: true,
      }),
    ],
    crypto,
    creationProps: { name: "Node.js node" },
  });

  const account = await node.node.load(node.accountID);

  return {
    node: node.node,
    account: account.core.getCurrentContent(),
  };
}
