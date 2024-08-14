import { DisconnectedError, Peer, PingTimeoutError, SyncMessage, cojsonInternals } from "cojson";

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
}

const g: typeof globalThis & {
    jazzPings?: {
        received: number;
        sent: number;
        dc: string;
    }[];
} = globalThis;

export function createWebSocketPeer({
    id,
    websocket,
    role,
}: {
    id: string;
    websocket: AnyWebSocket;
    role: Peer["role"];
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
        pingTimeout = setTimeout(() => {
            incoming
                .push("PingTimeout")
                .catch((e) =>
                    console.error("Error while pushing ping timeout", e),
                );
        }, 10_000);
    });

    return {
        id,
        incoming,
        outgoing: {
            push(msg) {
                websocket.send(JSON.stringify(msg));
                return Promise.resolve();
            },
        },
        role,
    };
}
