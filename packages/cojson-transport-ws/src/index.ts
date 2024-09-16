import {
    DisconnectedError,
    Peer,
    PingTimeoutError,
    SyncMessage,
    cojsonInternals,
} from "cojson";
import { PriorityBasedMessageQueue } from "./PriorityBasedMessageQueue.js";
import { AnyWebSocket, PingMsg } from "./types.js";

 const g: typeof globalThis & {
    jazzPings?: {
        received: number;
        sent: number;
        dc: string;
    }[];
} = globalThis;

export const BUFFER_LIMIT = 100_000;
export const BUFFER_LIMIT_POLLING_INTERVAL = 10;

export function createWebSocketPeer({
    id,
    websocket,
    role,
    expectPings = true,
}: {
    id: string;
    websocket: AnyWebSocket;
    role: Peer["role"];
    expectPings?: boolean;
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

    websocket.addEventListener("message", function handleIncomingMsg(event) {
        const msg = JSON.parse(event.data as string);
        pingTimeout && clearTimeout(pingTimeout);

        if (msg?.type === "ping") {
            const ping = msg as PingMsg;
            g.jazzPings ||= [];
            g.jazzPings.push({
                received: Date.now(),
                sent: ping.time,
                dc: ping.dc,
            });
        } else {
            incoming
                .push(msg)
                .catch((e) =>
                    console.error("Error while pushing incoming msg", e),
                );
        }
        if (expectPings) {
            pingTimeout = setTimeout(() => {
                incoming
                    .push("PingTimeout")
                    .catch((e) =>
                        console.error("Error while pushing ping timeout", e),
                    );
            }, 10_000);
        }
    });

    const websocketOpen = new Promise<void>((resolve) => {
        if (websocket.readyState === 1) {
            resolve();
        } else {
            websocket.addEventListener("open", resolve, { once: true });
        }
    });

    const outgoingMessageQueue = new PriorityBasedMessageQueue();

    let processing = false;

    async function processQueue() {
        if (processing) {
            return;
        }

        processing = true;

        await websocketOpen;

        while (outgoingMessageQueue.isNonEmpty()) {
            while (websocket.bufferedAmount > BUFFER_LIMIT && websocket.readyState === 1) {
                await new Promise<void>((resolve) => setTimeout(resolve, BUFFER_LIMIT_POLLING_INTERVAL));
            }

            if (websocket.readyState !== 1) {
                break;
            }

            const entry = outgoingMessageQueue.pull();

            if (entry) {
                websocket.send(JSON.stringify(entry.msg));

                // Flag that the message has been sent
                entry.resolve();
            }
        }

        processing = false;
    }

    function pushMessage(msg: SyncMessage) {
        const promise = outgoingMessageQueue.push(msg);

        void processQueue();

        // Resolves when the message has been sent
        return promise;
    }

    return {
        id,
        incoming,
        outgoing: {
            push: pushMessage,
            close() {
                console.log("Trying to close", id, websocket.readyState);
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
