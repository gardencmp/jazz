import {
    DisconnectedError,
    Peer,
    PingTimeoutError,
    SyncMessage,
    cojsonInternals,
} from "cojson";

interface WebsocketEvents {
    close: { code: number; reason: string };
    message: { data: unknown };
    open: void;
}
interface PingMsg {
    time: number;
    dc: string;
}

interface AnyWebSocket {
    addEventListener<K extends keyof WebsocketEvents>(
        type: K,
        listener: (event: WebsocketEvents[K]) => void,
        options?: { once: boolean },
    ): void;
    removeEventListener<K extends keyof WebsocketEvents>(
        type: K,
        listener: (event: WebsocketEvents[K]) => void,
    ): void;
    close(): void;
    send(data: string): void;
    readyState: number;
    bufferedAmount: number;
}

const g: typeof globalThis & {
    jazzPings?: {
        received: number;
        sent: number;
        dc: string;
    }[];
} = globalThis;

function promiseWithResolvers<R>() {
    let resolve = (_: R) => {};
    let reject = (_: unknown) => {};

    const promise = new Promise<R>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });

    return {
        promise,
        resolve,
        reject,
    };
}

const BUFFER_LIMIT = 100_000;

type QueueEntry = {
    msg: SyncMessage;
    promise: Promise<void>;
    resolve: () => void;
};

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

    const highPriorityQueue: QueueEntry[] = [];
    const lowPriorityQueue: QueueEntry[] = [];

    let processingActive = false;

    async function processQueue() {
        if (processingActive) {
            return;
        }

        processingActive = true;

        if (websocket.readyState !== 1) {
            await websocketOpen;
        }

        let roundRobinCycle = 0;

        while (highPriorityQueue.length > 0 || lowPriorityQueue.length > 0) {
            if (websocket.bufferedAmount > BUFFER_LIMIT) {
                await waitForLessBuffer();
            }

            if (websocket.readyState !== 1) {
                return;
            }

            let entry: QueueEntry | undefined = undefined;

            /**
             * We send a low priority message every 2 high priority messages.
             * This is to prevent starvation of low priority messages when a lot
             * of high priority messages are sent in a row.
             */
            const highPriorityActive =
                roundRobinCycle < 2 || lowPriorityQueue.length === 0;

            if (highPriorityQueue.length > 0 && highPriorityActive) {
                entry = highPriorityQueue.shift();

                roundRobinCycle++;
            } else if (lowPriorityQueue.length > 0) {
                entry = lowPriorityQueue.shift();
                roundRobinCycle = 0;
            }

            if (entry) {
                websocket.send(JSON.stringify(entry.msg));

                entry.resolve();
            }
        }

        processingActive = false;
    }

    function pushToQueue(msg: SyncMessage) {
        const { promise, resolve } = promiseWithResolvers<void>();

        if (msg.action === "content" && msg.lowPriority) {
            lowPriorityQueue.push({ msg, promise, resolve });
        } else {
            highPriorityQueue.push({ msg, promise, resolve });
        }

        void processQueue();

        return promise;
    }

    async function waitForLessBuffer() {
        if (websocket.readyState !== 1) return;

        while (websocket.bufferedAmount > BUFFER_LIMIT) {
            await new Promise<void>((resolve) => setTimeout(resolve, 10));

            if (websocket.readyState !== 1) {
                console.log(
                    "WebSocket closed while buffering",
                    id,
                    websocket.bufferedAmount,
                );
                return;
            }
        }
    }

    return {
        id,
        incoming,
        outgoing: {
            async push(msg) {
                return pushToQueue(msg);
            },
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
