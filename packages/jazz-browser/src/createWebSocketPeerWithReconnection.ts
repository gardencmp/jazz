import { Peer } from "cojson";
import { createWebSocketPeer } from "cojson-transport-ws";

export function createWebSocketPeerWithReconnection(
  peer: string,
  reconnectionTimeout: number | undefined,
  addPeer: (peer: Peer) => void,
) {
  const firstWsPeer = createWebSocketPeer({
    websocket: new WebSocket(peer),
    id: peer,
    role: "server",
    onClose: reconnectWebSocket,
  });

  let shouldTryToReconnect = true;
  let currentReconnectionTimeout = reconnectionTimeout || 500;

  function onOnline() {
    console.log("Online, resetting reconnection timeout");
    currentReconnectionTimeout = reconnectionTimeout || 500;
  }

  window.addEventListener("online", onOnline);

  async function reconnectWebSocket() {
    if (!shouldTryToReconnect) return;

    console.log(
      "Websocket disconnected, trying to reconnect in " +
        currentReconnectionTimeout +
        "ms",
    );
    currentReconnectionTimeout = Math.min(
      currentReconnectionTimeout * 2,
      30000,
    );

    await waitForOnline(currentReconnectionTimeout);

    if (!shouldTryToReconnect) return;

    addPeer(
      createWebSocketPeer({
        websocket: new WebSocket(peer),
        id: peer,
        role: "server",
        onClose: reconnectWebSocket,
      }),
    );
  }

  return {
    peer: firstWsPeer,
    done: () => {
      shouldTryToReconnect = false;
      window.removeEventListener("online", onOnline);
    },
  };
}
function waitForOnline(timeout: number) {
  return new Promise<void>((resolve) => {
    function handleTimeoutOrOnline() {
      clearTimeout(timer);
      window.removeEventListener("online", handleTimeoutOrOnline);
      resolve();
    }

    const timer = setTimeout(handleTimeoutOrOnline, timeout);

    window.addEventListener("online", handleTimeoutOrOnline);
  });
}
