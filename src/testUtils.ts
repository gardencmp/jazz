import { AgentSecret, createdNowUnique, getAgentID, newRandomAgentSecret  } from "./crypto.js";
import { newRandomSessionID } from "./coValue.js";
import { LocalNode } from "./node.js";
import { expectTeamContent } from "./permissions.js";
import { AnonymousControlledAccount } from "./account.js";
import { SessionID } from "./ids.js";
import { ReadableStream, TransformStream, WritableStream } from "isomorphic-streams";
import { Peer, PeerID, SyncMessage } from "./sync.js";

export function randomAnonymousAccountAndSessionID(): [AnonymousControlledAccount, SessionID] {
    const agentSecret = newRandomAgentSecret();

    const sessionID = newRandomSessionID(getAgentID(agentSecret));

    return [new AnonymousControlledAccount(agentSecret), sessionID];
}

export function newTeam() {
    const [admin, sessionID] = randomAnonymousAccountAndSessionID();

    const node = new LocalNode(admin, sessionID);

    const team = node.createCoValue({
        type: "comap",
        ruleset: { type: "team", initialAdmin: admin.id },
        meta: null,
        ...createdNowUnique(),
    });

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(admin.id, "admin", "trusting");
        expect(editable.get(admin.id)).toEqual("admin");
    });

    return { node, team, admin };
}

export function teamWithTwoAdmins() {
    const { team, admin, node } = newTeam();

    const otherAdmin = node.createAccount("otherAdmin");

    let content = expectTeamContent(team.getCurrentContent());

    content.edit((editable) => {
        editable.set(otherAdmin.id, "admin", "trusting");
        expect(editable.get(otherAdmin.id)).toEqual("admin");
    });

    content = expectTeamContent(team.getCurrentContent());

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.get(otherAdmin.id)).toEqual("admin");
    return { team, admin, otherAdmin, node };
}

export function newTeamHighLevel() {
    const [admin, sessionID] = randomAnonymousAccountAndSessionID();


    const node = new LocalNode(admin, sessionID);

    const team = node.createTeam();

    return { admin, node, team };
}

export function teamWithTwoAdminsHighLevel() {
    const { admin, node, team } = newTeamHighLevel();

    const otherAdmin = node.createAccount("otherAdmin");

    team.addMember(otherAdmin.id, "admin");

    return { admin, node, team, otherAdmin };
}

export function newStreamPair<T>(): [ReadableStream<T>, WritableStream<T>] {
    const queue: T[] = [];
    let resolveNextItemReady: () => void = () => {};
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

        cancel(reason) {
            console.log("Manually closing reader");
            readerClosed = true;
        },
    });

    const writable = new WritableStream<T>({
        write(chunk, controller) {
            if (readerClosed) {
                console.log("Reader closed, not writing chunk", chunk);
                throw new Error("Reader closed, not writing chunk");
            }
            queue.push(chunk);
            if (queue.length === 1) {
                // make sure that await write resolves before corresponding read
                process.nextTick(() => resolveNextItemReady());
            }
        },
        abort(reason) {
            console.log("Manually closing writer");
            writerClosed = true;
            resolveNextItemReady();
            return Promise.resolve();
        },
    });

    return [readable, writable];
}

export function shouldNotResolve<T>(
    promise: Promise<T>,
    ops: { timeout: number }
): Promise<void> {
    return new Promise((resolve, reject) => {
        promise
            .then((v) =>
                reject(
                    new Error(
                        "Should not have resolved, but resolved to " +
                            JSON.stringify(v)
                    )
                )
            )
            .catch(reject);
        setTimeout(resolve, ops.timeout);
    });
}

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
                    controller: { enqueue: (msg: SyncMessage) => void }
                ) {
                    trace && console.log(`${peer2id} -> ${peer1id}`, JSON.stringify(chunk, null, 2));
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
                    controller: { enqueue: (msg: SyncMessage) => void }
                ) {
                    trace && console.log(`${peer1id} -> ${peer2id}`, JSON.stringify(chunk, null, 2));
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