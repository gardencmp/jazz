import { ReadableStream, TransformStream, WritableStream } from "isomorphic-streams";
import { Peer, PeerID, SyncMessage } from "./sync.js";


export function connectedPeers(
    peer1id: PeerID,
    peer2id: PeerID,
    {
        trace = false, peer1role = "peer", peer2role = "peer",
    }: {
        trace?: boolean;
        peer1role?: Peer["role"];
        peer2role?: Peer["role"];
    } = {}
): [Peer, Peer] {
    const [inRx1, inTx1] = newStreamPair<SyncMessage>();
    const [outRx1, outTx1] = newStreamPair<SyncMessage>();

    const [inRx2, inTx2] = newStreamPair<SyncMessage>();
    const [outRx2, outTx2] = newStreamPair<SyncMessage>();

    void outRx2
        .pipeThrough(
            new TransformStream({
                transform(
                    chunk: SyncMessage,
                    controller: { enqueue: (msg: SyncMessage) => void; }
                ) {
                    trace && console.debug(`${peer2id} -> ${peer1id}`, JSON.stringify(chunk, null, 2));
                    controller.enqueue(chunk);
                },
            })
        )
        .pipeTo(inTx1);

    void outRx1
        .pipeThrough(
            new TransformStream({
                transform(
                    chunk: SyncMessage,
                    controller: { enqueue: (msg: SyncMessage) => void; }
                ) {
                    trace && console.debug(`${peer1id} -> ${peer2id}`, JSON.stringify(chunk, null, 2));
                    controller.enqueue(chunk);
                },
            })
        )
        .pipeTo(inTx2);

    const peer2AsPeer: Peer = {
        id: peer2id,
        incoming: inRx1,
        outgoing: outTx1,
        role: peer2role,
    };

    const peer1AsPeer: Peer = {
        id: peer1id,
        incoming: inRx2,
        outgoing: outTx2,
        role: peer1role,
    };

    return [peer1AsPeer, peer2AsPeer];
}

export function newStreamPair<T>(): [ReadableStream<T>, WritableStream<T>] {
    const queue: T[] = [];
    let resolveNextItemReady: () => void = () => { };
    let nextItemReady: Promise<void> = new Promise((resolve) => {
        resolveNextItemReady = resolve;
    });

    let writerClosed = false;
    let readerClosed = false;

    const readable = new ReadableStream<T>({
        async pull(controller) {
            let retriesLeft = 3;
            while (retriesLeft > 0) {
                if (writerClosed) {
                    controller.close();
                    return;
                }
                retriesLeft--;
                if (queue.length > 0) {
                    controller.enqueue(queue.shift()!);
                    if (queue.length === 0) {
                        nextItemReady = new Promise((resolve) => {
                            resolveNextItemReady = resolve;
                        });
                    }
                    return;
                } else {
                    await nextItemReady;
                }
            }
            throw new Error(
                "Should only use one retry to get next item in queue."
            );
        },

        cancel(_reason) {
            console.log("Manually closing reader");
            readerClosed = true;
        },
    });

    const writable = new WritableStream<T>({
        write(chunk) {
            if (readerClosed) {
                console.log("Reader closed, not writing chunk", chunk);
                throw new Error("Reader closed, not writing chunk");
            }
            queue.push(chunk);
            if (queue.length === 1) {
                // make sure that await write resolves before corresponding read
                setTimeout(() => resolveNextItemReady());
            }
        },
        abort(_reason) {
            console.log("Manually closing writer");
            writerClosed = true;
            resolveNextItemReady();
            return Promise.resolve();
        },
    });

    return [readable, writable];
}
