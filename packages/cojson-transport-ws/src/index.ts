import {
  DisconnectedError,
  Peer,
  PingTimeoutError,
  SyncMessage,
  cojsonInternals,
} from "cojson";
import { BatchedOutgoingMessages } from "./BatchedOutgoingMessages.js";
import { deserializeMessages } from "./serialization.js";
import { AnyWebSocket } from "./types.js";

export const BUFFER_LIMIT = 100_000;
export const BUFFER_LIMIT_POLLING_INTERVAL = 10;

export type CreateWebSocketPeerOpts = {
  id: string;
  websocket: AnyWebSocket;
  role: Peer["role"];
  expectPings?: boolean;
  batchingByDefault?: boolean;
  deletePeerStateOnClose?: boolean;
  onClose?: () => void;
};

function createPingTimeoutListener(enabled: boolean, callback: () => void) {
  if (!enabled) {
    return {
      reset() {},
      clear() {},
    };
  }

  let pingTimeout: ReturnType<typeof setTimeout> | null = null;

  return {
    reset() {
      pingTimeout && clearTimeout(pingTimeout);
      pingTimeout = setTimeout(() => {
        callback();
      }, 10_000);
    },
    clear() {
      pingTimeout && clearTimeout(pingTimeout);
    },
  };
}

function waitForWebSocketOpen(websocket: AnyWebSocket) {
  return new Promise<void>((resolve) => {
    if (websocket.readyState === 1) {
      resolve();
    } else {
      websocket.addEventListener("open", resolve, { once: true });
    }
  });
}

function createOutgoingMessagesManager(
  websocket: AnyWebSocket,
  batchingByDefault: boolean,
) {
  let closed = false;
  const outgoingMessages = new BatchedOutgoingMessages((messages) => {
    if (websocket.readyState === 1) {
      websocket.send(messages);
    }
  });

  let batchingEnabled = batchingByDefault;

  async function sendMessage(msg: SyncMessage) {
    if (closed) {
      return Promise.reject(new Error("WebSocket closed"));
    }

    if (websocket.readyState !== 1) {
      await waitForWebSocketOpen(websocket);
    }

    while (
      websocket.bufferedAmount > BUFFER_LIMIT &&
      websocket.readyState === 1
    ) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, BUFFER_LIMIT_POLLING_INTERVAL),
      );
    }

    if (websocket.readyState !== 1) {
      return;
    }

    if (!batchingEnabled) {
      websocket.send(JSON.stringify(msg));
    } else {
      outgoingMessages.push(msg);
    }
  }

  return {
    sendMessage,
    setBatchingEnabled(enabled: boolean) {
      batchingEnabled = enabled;
    },
    close() {
      closed = true;
      outgoingMessages.close();
    },
  };
}

function createClosedEventEmitter(callback = () => {}) {
  let disconnected = false;

  return () => {
    if (disconnected) return;
    disconnected = true;
    callback();
  };
}

export function createWebSocketPeer({
  id,
  websocket,
  role,
  expectPings = true,
  batchingByDefault = true,
  deletePeerStateOnClose = false,
  onClose,
}: CreateWebSocketPeerOpts): Peer {
  const incoming = new cojsonInternals.Channel<
    SyncMessage | DisconnectedError | PingTimeoutError
  >();
  const emitClosedEvent = createClosedEventEmitter(onClose);

  function handleClose() {
    incoming
      .push("Disconnected")
      .catch((e) => console.error("Error while pushing disconnect msg", e));
    emitClosedEvent();
  }

  websocket.addEventListener("close", handleClose);

  const pingTimeout = createPingTimeoutListener(expectPings, () => {
    incoming
      .push("PingTimeout")
      .catch((e) => console.error("Error while pushing ping timeout", e));
    emitClosedEvent();
  });

  const outgoingMessages = createOutgoingMessagesManager(
    websocket,
    batchingByDefault,
  );

  function handleIncomingMsg(event: { data: unknown }) {
    if (event.data === "") {
      console.log("client", id, "sent empty message");
      return;
    }

    const result = deserializeMessages(event.data);

    if (!result.ok) {
      console.error(
        "Error while deserializing messages",
        event.data,
        result.error,
      );
      return;
    }

    const { messages } = result;

    if (messages.length > 1) {
      // If more than one message is received, the other peer supports batching
      outgoingMessages.setBatchingEnabled(true);
    }

    pingTimeout.reset();

    for (const msg of messages) {
      if (msg && "action" in msg) {
        incoming
          .push(msg)
          .catch((e) => console.error("Error while pushing incoming msg", e));
      }
    }
  }

  websocket.addEventListener("message", handleIncomingMsg);

  return {
    id,
    incoming,
    outgoing: {
      push: outgoingMessages.sendMessage,
      close() {
        console.log("Trying to close", id, websocket.readyState);
        outgoingMessages.close();

        websocket.removeEventListener("message", handleIncomingMsg);
        websocket.removeEventListener("close", handleClose);
        pingTimeout.clear();
        emitClosedEvent();

        if (websocket.readyState === 0) {
          websocket.addEventListener(
            "open",
            function handleClose() {
              websocket.close();
            },
            { once: true },
          );
        } else if (websocket.readyState == 1) {
          websocket.close();
        }
      },
    },
    role,
    crashOnClose: false,
    deletePeerStateOnClose,
  };
}
