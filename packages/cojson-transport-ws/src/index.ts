import { DisconnectedError, Peer, PingTimeoutError, SyncMessage } from "cojson";
import { Either, Stream, Queue, Effect, Exit } from "effect";

interface AnyWebSocket {
    addEventListener(
        type: "close",
        listener: (event: { code: number; reason: string }) => void,
    ): void;
    addEventListener(
        type: "message",
        listener: (event: { data: string | unknown }) => void,
    ): void;
    addEventListener(type: "open", listener: () => void): void;
    close(): void;
    send(data: string): void;
}

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

        ws.addEventListener("close", (event) => {
            void Effect.runPromiseExit(
                Queue.offer(
                    incoming,
                    Either.left(
                        new DisconnectedError(`${event.code}: ${event.reason}`),
                    ),
                ),
            ).then((e) => {
                if (Exit.isFailure(e) && !Exit.isInterrupted(e)) {
                    console.warn("Failed closing ws", e);
                }
            });
        });

        let pingTimeout: ReturnType<typeof setTimeout> | undefined;

        ws.addEventListener("message", (event) => {
            const msg = JSON.parse(event.data as string);

            if (pingTimeout) {
                clearTimeout(pingTimeout);
            }

            pingTimeout = setTimeout(() => {
                console.debug("Ping timeout");
                void Effect.runPromise(
                    Queue.offer(incoming, Either.left(new PingTimeoutError())),
                );
                try {
                    ws.close();
                } catch (e) {
                    console.error(
                        "Error while trying to close ws on ping timeout",
                        e,
                    );
                }
            }, 2500);

            if (msg.type === "ping") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (globalThis as any).jazzPings =
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (globalThis as any).jazzPings || [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (globalThis as any).jazzPings.push({
                    received: Date.now(),
                    sent: msg.time,
                    dc: msg.dc,
                });
                return;
            } else {
                void Effect.runPromise(
                    Queue.offer(incoming, Either.right(msg)),
                );
            }
        });

        ws.addEventListener("open", () => {
            void Stream.fromQueue(outgoing).pipe(
                Stream.runForEach((msg) =>
                    Effect.sync(() => ws.send(JSON.stringify(msg))),
                ),
                Effect.runPromise,
            );
        });

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
