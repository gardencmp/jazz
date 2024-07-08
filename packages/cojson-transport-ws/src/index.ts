import { DisconnectedError, Peer, PingTimeoutError, SyncMessage } from "cojson";
import {
    Either,
    Stream,
    Queue,
    Effect,
    Exit,
    Runtime,
    Console,
    Fiber,
    GlobalValue,
} from "effect";

interface WebsocketEvents {
    close: { code: number; reason: string };
    message: { data: string | unknown };
    open: void;
}

interface AnyWebSocket {
    addEventListener<K extends keyof WebsocketEvents>(
        type: K,
        listener: (event: WebsocketEvents[K]) => void,
    ): void;
    close(): void;
    send(data: string): void;
}

const jazzPings = GlobalValue.globalValue<
    Array<{
        received: number;
        sent: number;
        dc: string;
    }>
>("jazzPings", () => []);

export function createWebSocketPeer(options: {
    id: string;
    websocket: AnyWebSocket;
    role: Peer["role"];
}): Effect.Effect<Peer> {
    return Effect.gen(function* () {
        const ws = options.websocket;

        const incoming =
            yield* Queue.unbounded<
                Either.Either<SyncMessage, DisconnectedError | PingTimeoutError>
            >();
        const outgoing = yield* Queue.unbounded<SyncMessage>();

        yield* addEventListener(ws, "close", (event) =>
            Queue.offer(
                incoming,
                Either.left(
                    new DisconnectedError(`${event.code}: ${event.reason}`),
                ),
            ).pipe(
                Effect.onExit((e) => {
                    if (Exit.isFailure(e) || Exit.isInterrupted(e)) {
                        return Console.warn("Failed closing ws", e);
                    }
                    return Effect.void;
                }),
            ),
        );

        let pingTimeout: Fiber.Fiber<void> | undefined;

        yield* addEventListener(ws, "message", (event) =>
            Effect.gen(function* () {
                const msg = yield* Effect.sync(() =>
                    JSON.parse(event.data as string),
                );

                if (pingTimeout) {
                    yield* Fiber.interrupt(pingTimeout);
                }

                pingTimeout = yield* Effect.gen(function* () {
                    yield* Effect.sleep("2500 millis");
                    yield* Console.warn("Ping timeout");
                    yield* Queue.offer(
                        incoming,
                        Either.left(new PingTimeoutError()),
                    ).pipe(Effect.forkDaemon);
                    yield* Effect.sync(() => {
                        try {
                            ws.close();
                        } catch (e) {
                            console.error(
                                "Error while trying to close ws on ping timeout",
                                e,
                            );
                        }
                    });

                    if (msg.type !== "ping") {
                        yield* Queue.offer(incoming, Either.right(msg));
                        return;
                    }

                    jazzPings.push({
                        received: Date.now(),
                        sent: msg.time,
                        dc: msg.dc,
                    });
                }).pipe(Effect.forkDaemon);
            }),
        );

        yield* addEventListener(ws, "open", () =>
            Queue.take(outgoing).pipe(
                Effect.andThen((message) => ws.send(JSON.stringify(message))),
                Effect.forever,
            ),
        );

        return {
            id: options.id,
            incoming: Stream.fromQueue(incoming, { shutdown: true }).pipe(
                Stream.mapEffect((either) => either),
            ),
            outgoing,
            role: options.role,
        };
    });
}

const addEventListener = <Event extends keyof WebsocketEvents, R>(
    ws: AnyWebSocket,
    event: Event,
    listener: (msg: WebsocketEvents[Event]) => Effect.Effect<void, never, R>,
) =>
    Effect.gen(function* () {
        const runFork = Runtime.runFork(yield* Effect.runtime<R>());
        ws.addEventListener(event, (msg) => {
            runFork(listener(msg));
        });
    });
