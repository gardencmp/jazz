import {
    DisconnectedError,
    Peer,
    PingTimeoutError,
    SyncMessage,
    cojsonInternals,
} from "cojson";
import { AnyWebSocket } from "./types.js";
import { BatchedOutgoingMessages } from "./BatchedOutgoingMessages.js";

export const BUFFER_LIMIT = 100_000;
export const BUFFER_LIMIT_POLLING_INTERVAL = 10;

export function createWebSocketPeer({
    id,
    websocket,
    role,
    expectPings = true,
    batchingByDefault = true,
}: {
    id: string;
    websocket: AnyWebSocket;
    role: Peer["role"];
    expectPings?: boolean;
    batchingByDefault?: boolean;
}): Peer {
    const incoming = new cojsonInternals.Channel<
        SyncMessage | DisconnectedError | PingTimeoutError
    >();

    websocket.addEventListener("close", function handleClose() {
        incoming
            .push("Disconnected")
            .catch((e) =>
                console.error("Error while pushing disconnect msg", e),
            );
    });

    let pingTimeout: ReturnType<typeof setTimeout> | null = null;

    let supportsBatching = batchingByDefault;

    websocket.addEventListener("message", function handleIncomingMsg(event) {
        let messagesChunk = (event.data as string).split("\n").map((msg) => JSON.parse(msg));

        if (!Array.isArray(messagesChunk)) {
            messagesChunk = [messagesChunk];
        } else {
            // If the messages are coming in chunks, we can assume that the other peer supports batching
            supportsBatching = true;
        }

        if (expectPings) {
            pingTimeout && clearTimeout(pingTimeout);
            pingTimeout = setTimeout(() => {
                incoming
                    .push("PingTimeout")
                    .catch((e) =>
                        console.error("Error while pushing ping timeout", e),
                    );
            }, 10_000);
        }

        for (const msg of messagesChunk) {
            if (msg?.type !== "ping") {
                incoming
                    .push(msg)
                    .catch((e) =>
                        console.error("Error while pushing incoming msg", e),
                    );
            }
        }
    });

    const websocketOpen = new Promise<void>((resolve) => {
        if (websocket.readyState === 1) {
            resolve();
        } else {
            websocket.addEventListener("open", resolve, { once: true });
        }
    });

    const outgoingMessages = new BatchedOutgoingMessages((messages) => {
        if (websocket.readyState === 1) {
            websocket.send(messages.map((msg) => JSON.stringify(msg)).join("\n"));
        }
    });

    async function pushMessage(msg: SyncMessage) {
        if (websocket.readyState !== 1) {
            await websocketOpen;
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

        if (!supportsBatching) {
            websocket.send(JSON.stringify(msg));
        } else {
            outgoingMessages.push(msg);
        }
    }

    return {
        id,
        incoming,
        outgoing: {
            push: pushMessage,
            close() {
                console.log("Trying to close", id, websocket.readyState);
                outgoingMessages.close();

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
    };
}
