import { Peer, PeerID, SyncMessage } from "./sync.js";
import { Channel } from "queueueue";
export { Channel } from "queueueue";

export function connectedPeers(
    peer1id: PeerID,
    peer2id: PeerID,
    {
        trace = false,
        peer1role = "peer",
        peer2role = "peer",
        crashOnClose = false,
    }: {
        trace?: boolean;
        peer1role?: Peer["role"];
        peer2role?: Peer["role"];
        crashOnClose?: boolean;
    } = {},
): [Peer, Peer] {
    const [from1to2Rx, from1to2Tx] = newQueuePair(
        trace ? { traceAs: `${peer1id} -> ${peer2id}` } : undefined,
    );
    const [from2to1Rx, from2to1Tx] = newQueuePair(
        trace ? { traceAs: `${peer2id} -> ${peer1id}` } : undefined,
    );

    const peer2AsPeer: Peer = {
        id: peer2id,
        incoming: from2to1Rx,
        outgoing: from1to2Tx,
        role: peer2role,
        crashOnClose: crashOnClose,
    };

    const peer1AsPeer: Peer = {
        id: peer1id,
        incoming: from1to2Rx,
        outgoing: from2to1Tx,
        role: peer1role,
        crashOnClose: crashOnClose,
    };

    return [peer1AsPeer, peer2AsPeer];
}

export function newQueuePair(
    options: { traceAs?: string } = {},
): [AsyncIterable<SyncMessage>, Channel<SyncMessage>] {
    const channel = new Channel<SyncMessage>();

    if (options.traceAs) {
        return [
            (async function* () {
                for await (const msg of channel) {
                    console.debug(
                        options.traceAs,
                        JSON.stringify(
                            msg,
                            (k, v) =>
                                k === "changes" || k === "encryptedChanges"
                                    ? v.slice(0, 20) + "..."
                                    : v,
                            2,
                        ),
                    );
                    yield msg;
                }
            })(),
            channel,
        ];
    } else {
        return [channel.wrap(), channel];
    }
}
