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
        const [from1to2Rx, from1to2Tx] = yield* newQueuePair(
            trace ? { traceAs: `${peer1id} -> ${peer2id}` } : undefined,
        );
        const [from2to1Rx, from2to1Tx] = yield* newQueuePair(
            trace ? { traceAs: `${peer2id} -> ${peer1id}` } : undefined,
        );

        const peer2AsPeer: Peer = {
            id: peer2id,
            incoming: from2to1Rx,
            outgoing: from1to2Tx,
            role: peer2role,
        };

        const peer1AsPeer: Peer = {
            id: peer1id,
            incoming: from1to2Rx,
            outgoing: from2to1Tx,
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
