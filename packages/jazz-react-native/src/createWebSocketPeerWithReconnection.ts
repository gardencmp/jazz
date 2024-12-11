import NetInfo from "@react-native-community/netinfo";
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

  const initialReconnectionTimeout = reconnectionTimeout || 500;
  let shouldTryToReconnect = true;
  let currentReconnectionTimeout = initialReconnectionTimeout;

  const unsubscribeNetworkChange = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      currentReconnectionTimeout = initialReconnectionTimeout;
    }
  });

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
      unsubscribeNetworkChange();
    },
  };
}

function waitForOnline(timeout: number) {
  return new Promise<void>((resolve) => {
    const unsubscribeNetworkChange = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        handleTimeoutOrOnline();
      }
    });

    function handleTimeoutOrOnline() {
      clearTimeout(timer);
      unsubscribeNetworkChange();
      resolve();
    }

    const timer = setTimeout(handleTimeoutOrOnline, timeout);
  });
}
