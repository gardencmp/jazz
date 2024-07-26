import { DisconnectedError, Peer, PingTimeoutError, SyncMessage } from "cojson";
import { Stream, Queue, Effect, Console } from "effect";

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

export function createWebSocketPeer(options: {
    id: string;
    websocket: AnyWebSocket;
    role: Peer["role"];
}): Effect.Effect<Peer> {
    return Effect.gen(function* () {
        const ws = options.websocket;
        const ws_ = ws as unknown as Stream.EventListener<WebsocketEvents["message"]>;

        const outgoing = yield* Queue.unbounded<SyncMessage>();

        const closed = once(ws, "close").pipe(
            Effect.flatMap(
                (event) =>
                    new DisconnectedError({
                        message: `${event.code}: ${event.reason}`,
                    }),
            ),
            Stream.fromEffect,
        );

        const isSyncMessage = (msg: unknown): msg is SyncMessage => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((msg as any)?.type === "ping") {
                const ping = msg as PingMsg;
                g.jazzPings ||= [];
                g.jazzPings.push({
                    received: Date.now(),
                    sent: ping.time,
                    dc: ping.dc,
                });
                return false;
            }
            return true;
        };

        yield* Effect.forkDaemon(Effect.gen(function* () {
            yield* once(ws, "open");
            yield* Queue.take(outgoing).pipe(
                Effect.andThen((message) => ws.send(JSON.stringify(message))),
                Effect.forever,
            );
        }));

        type E = WebsocketEvents["message"];
        const messages = Stream.fromEventListener<E>(ws_, "message").pipe(
            Stream.timeoutFail(() => new PingTimeoutError(), "10 seconds"),
            Stream.tapError((_e) =>
                Console.warn("Ping timeout").pipe(
                    Effect.andThen(Effect.try(() => ws.close())),
                    Effect.catchAll((e) =>
                        Console.error(
                            "Error while trying to close ws on ping timeout",
                            e,
                        ),
                    ),
                ),
            ),
            Stream.mergeLeft(closed),
            Stream.map((_) => JSON.parse(_.data as string)),
            Stream.filter(isSyncMessage),
            Stream.buffer({ capacity: "unbounded" }),
            Stream.onDone(() => Queue.shutdown(outgoing)),
        );

        return {
            id: options.id,
            incoming: messages,
            outgoing,
            role: options.role,
        };
    });
}

const once = <Event extends keyof WebsocketEvents>(
    ws: AnyWebSocket,
    event: Event,
) =>
    Effect.async<WebsocketEvents[Event]>((register) => {
        const cb = (msg: WebsocketEvents[Event]) => {
            ws.removeEventListener(event, cb);
            register(Effect.succeed(msg));
        };
        ws.addEventListener(event, cb);
    });
