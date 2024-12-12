import { Peer } from "cojson";
import { createWebSocketPeer } from "cojson-transport-ws";
import { WebSocket } from "ws";

export function webSocketWithReconnection(
  peer: string,
  addPeer: (peer: Peer) => void,
) {
  let done = false;
  const wsPeer = createWebSocketPeer({
    websocket: new WebSocket(peer),
    id: "upstream",
    role: "server",
    onClose: handleClose,
  });

  let timer: ReturnType<typeof setTimeout>;
  function handleClose() {
    if (done) return;

    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(new Date(), "Reconnecting to upstream " + peer);

      const wsPeer: Peer = createWebSocketPeer({
        id: "upstream",
        websocket: new WebSocket(peer),
        role: "server",
        onClose: handleClose,
      });

      addPeer(wsPeer);
    }, 1000);
  }

  return {
    peer: wsPeer,
    done: () => {
      done = true;
      clearTimeout(timer);
    },
  };
}
