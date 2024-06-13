import { Console, Effect, Queue, Stream } from "effect";
import { Peer, PeerID, SyncMessage } from "./sync.js";

export function connectedPeers(
    peer1id: PeerID,
    peer2id: PeerID,
    {
        trace = false,
        peer1role = "peer",
        peer2role = "peer",
    }: {
        trace?: boolean;
        peer1role?: Peer["role"];
        peer2role?: Peer["role"];
    } = {},
): Effect.Effect<[Peer, Peer]> {
    return Effect.gen(function* () {
        const [incoming2, outgoing1] = yield* newQueuePair(
            trace ? { traceAs: `${peer1id} -> ${peer2id}` } : undefined,
        );
        const [incoming1, outgoing2] = yield* newQueuePair(
            trace ? { traceAs: `${peer2id} -> ${peer1id}` } : undefined,
        );

        const peer2AsPeer: Peer = {
            id: peer2id,
            incoming: incoming2,
            outgoing: outgoing2,
            role: peer2role,
        };

        const peer1AsPeer: Peer = {
            id: peer1id,
            incoming: incoming1,
            outgoing: outgoing1,
            role: peer1role,
        };

        return [peer1AsPeer, peer2AsPeer];
    });
}

export function newQueuePair(
    options: { traceAs?: string } = {},
): Effect.Effect<[Stream.Stream<SyncMessage>, Queue.Enqueue<SyncMessage>]> {
    return Effect.gen(function* () {
        const queue = yield* Queue.unbounded<SyncMessage>();

        if (options.traceAs) {
            return [Stream.fromQueue(queue).pipe(Stream.tap((msg) => Console.debug(
                options.traceAs,
                JSON.stringify(
                    msg,
                    (k, v) =>
                        k === "changes" ||
                        k === "encryptedChanges"
                            ? v.slice(0, 20) + "..."
                            : v,
                    2,
                ),
            ))), queue];
        } else {
            return [Stream.fromQueue(queue), queue];
        }
    });
}
