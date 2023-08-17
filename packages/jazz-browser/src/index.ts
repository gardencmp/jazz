import {
    LocalNode,
    cojsonInternals,
    CojsonInternalTypes,
    SessionID,
    SyncMessage,
    Peer
} from "cojson";
import { ReadableStream, WritableStream } from "isomorphic-streams";
import { IDBStorage } from "jazz-storage-indexeddb";

export type BrowserNodeHandle = {
    node: LocalNode;
    // TODO: Symbol.dispose?
    done: () => void;
};

export async function createBrowserNode({
    auth,
    syncAddress = "wss://sync.jazz.tools",
    reconnectionTimeout = 300,
}: {
    auth: AuthProvider;
    syncAddress?: string;
    reconnectionTimeout?: number;
}): Promise<BrowserNodeHandle> {
    let sessionDone: () => void;

    const firstWsPeer = createWebSocketPeer(syncAddress);
    let shouldTryToReconnect = true;

    const node = await auth.createNode(
        (accountID) => {
            const sessionHandle = getSessionHandleFor(accountID);
            sessionDone = sessionHandle.done;
            return sessionHandle.session;
        },
        [await IDBStorage.asPeer({ trace: true }), firstWsPeer]
    );

    void async function websocketReconnectLoop() {
        while (shouldTryToReconnect) {
            if (
                Object.keys(node.sync.peers).some((peerId) =>
                    peerId.includes(syncAddress)
                )
            ) {
                await new Promise((resolve) =>
                    setTimeout(resolve, reconnectionTimeout)
                );
            } else {
                console.log("Websocket disconnected, trying to reconnect");
                node.sync.addPeer(createWebSocketPeer(syncAddress));
                await new Promise((resolve) =>
                    setTimeout(resolve, reconnectionTimeout)
                );
            }
        }
    };

    return {
        node,
        done: () => {
            shouldTryToReconnect = false;
            sessionDone?.();
        },
    };
}

export interface AuthProvider {
    createNode(
        getSessionFor: SessionProvider,
        initialPeers: Peer[]
    ): Promise<LocalNode>;
}

export type SessionProvider = (accountID: CojsonInternalTypes.AccountIDOrAgentID) => Promise<SessionID>;

export type SessionHandle = {
    session: Promise<SessionID>;
    done: () => void;
};

function getSessionHandleFor(
    accountID: CojsonInternalTypes.AccountIDOrAgentID
): SessionHandle {
    let done!: () => void;
    const donePromise = new Promise<void>((resolve) => {
        done = resolve;
    });

    let resolveSession: (sessionID: SessionID) => void;
    const sessionPromise = new Promise<SessionID>((resolve) => {
        resolveSession = resolve;
    });

    void (async function () {
        for (let idx = 0; idx < 100; idx++) {
            // To work better around StrictMode
            for (let retry = 0; retry < 2; retry++) {
                console.log("Trying to get lock", accountID + "_" + idx);
                const sessionFinishedOrNoLock = await navigator.locks.request(
                    accountID + "_" + idx,
                    { ifAvailable: true },
                    async (lock) => {
                        if (!lock) return "noLock";

                        const sessionID =
                            localStorage[accountID + "_" + idx] ||
                            cojsonInternals.newRandomSessionID(accountID);
                        localStorage[accountID + "_" + idx] = sessionID;

                        console.log(
                            "Got lock",
                            accountID + "_" + idx,
                            sessionID
                        );

                        resolveSession(sessionID);

                        await donePromise;
                        console.log(
                            "Done with lock",
                            accountID + "_" + idx,
                            sessionID
                        );
                        return "sessionFinished";
                    }
                );

                if (sessionFinishedOrNoLock === "sessionFinished") {
                    return;
                }
            }
        }
        throw new Error("Couldn't get lock on session after 100x2 tries");
    })();

    return {
        session: sessionPromise,
        done,
    };
}

function websocketReadableStream<T>(ws: WebSocket) {
    ws.binaryType = "arraybuffer";

    return new ReadableStream<T>({
        start(controller) {
            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.type === "ping") {
                    console.debug(
                        "Got ping from",
                        msg.dc,
                        "latency",
                        Date.now() - msg.time,
                        "ms"
                    );
                    return;
                }
                controller.enqueue(msg);
            };
            ws.onclose = () => controller.close();
            ws.onerror = () =>
                controller.error(new Error("The WebSocket errored!"));
        },

        cancel() {
            ws.close();
        },
    });
}

function createWebSocketPeer(syncAddress: string): Peer {
    const ws = new WebSocket(syncAddress);

    const incoming = websocketReadableStream<SyncMessage>(ws);
    const outgoing = websocketWritableStream<SyncMessage>(ws);

    return {
        id: syncAddress + "@" + new Date().toISOString(),
        incoming,
        outgoing,
        role: "server",
    };
}

function websocketWritableStream<T>(ws: WebSocket) {
    return new WritableStream<T>({
        start(controller) {
            ws.onerror = () => {
                controller.error(new Error("The WebSocket errored!"));
                ws.onclose = null;
            };
            ws.onclose = () =>
                controller.error(
                    new Error("The server closed the connection unexpectedly!")
                );
            return new Promise((resolve) => (ws.onopen = resolve));
        },

        write(chunk) {
            ws.send(JSON.stringify(chunk));
            // Return immediately, since the web socket gives us no easy way to tell
            // when the write completes.
        },

        close() {
            return closeWS(1000);
        },

        abort(reason) {
            return closeWS(4000, reason && reason.message);
        },
    });

    function closeWS(code: number, reasonString?: string) {
        return new Promise<void>((resolve, reject) => {
            ws.onclose = (e) => {
                if (e.wasClean) {
                    resolve();
                } else {
                    reject(new Error("The connection was not closed cleanly"));
                }
            };
            ws.close(code, reasonString);
        });
    }
}
