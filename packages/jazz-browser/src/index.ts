import { InviteSecret } from "cojson";
import {
    LocalNode,
    cojsonInternals,
    CojsonInternalTypes,
    SessionID,
    SyncMessage,
    Peer,
    ContentType,
    Group,
    CoID,
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

    async function websocketReconnectLoop() {
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
    }

    void websocketReconnectLoop();

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

export type SessionProvider = (
    accountID: CojsonInternalTypes.AccountIDOrAgentID
) => Promise<SessionID>;

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
                console.debug("Trying to get lock", accountID + "_" + idx);
                const sessionFinishedOrNoLock = await navigator.locks.request(
                    accountID + "_" + idx,
                    { ifAvailable: true },
                    async (lock) => {
                        if (!lock) return "noLock";

                        const sessionID =
                            localStorage[accountID + "_" + idx] ||
                            cojsonInternals.newRandomSessionID(accountID);
                        localStorage[accountID + "_" + idx] = sessionID;

                        console.debug(
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
            let pingTimeout: ReturnType<typeof setTimeout> | undefined;

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

                    if (pingTimeout) {
                        clearTimeout(pingTimeout);
                    }

                    pingTimeout = setTimeout(() => {
                        console.debug("Ping timeout");
                        controller.close();
                        ws.close();
                    }, 2500);

                    return;
                }
                controller.enqueue(msg);
            };
            const closeListener = () => controller.close();
            ws.addEventListener("close", closeListener);
            ws.addEventListener("error", () => {
                controller.error(new Error("The WebSocket errored!"));
                ws.removeEventListener("close", closeListener);
            });
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
    const initialQueue = [] as T[];
    let isOpen = false;

    return new WritableStream<T>({
        start(controller) {
            ws.addEventListener("error", (event) => {
                controller.error(
                    new Error("The WebSocket errored!" + JSON.stringify(event))
                );
            });
            ws.addEventListener("close", () => {
                controller.error(
                    new Error("The server closed the connection unexpectedly!")
                );
            });
            ws.addEventListener("open", () => {
                for (const item of initialQueue) {
                    ws.send(JSON.stringify(item));
                }
                isOpen = true;
            });
        },

        async write(chunk) {
            if (isOpen) {
                ws.send(JSON.stringify(chunk));
                // Return immediately, since the web socket gives us no easy way to tell
                // when the write completes.
            } else {
                initialQueue.push(chunk);
            }
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
            ws.addEventListener(
                "close",
                (e) => {
                    if (e.wasClean) {
                        resolve();
                    } else {
                        reject(
                            new Error("The connection was not closed cleanly")
                        );
                    }
                },
                { once: true }
            );
            ws.close(code, reasonString);
        });
    }
}

export function createInviteLink(
    value: ContentType,
    role: "reader" | "writer" | "admin",
    // default to same address as window.location, but without hash
    {
        baseURL = window.location.href.replace(/#.*$/, ""),
    }: { baseURL?: string } = {}
): string {
    const coValue = value.coValue;
    const node = coValue.node;
    let currentCoValue = coValue;

    while (currentCoValue.header.ruleset.type === "ownedByGroup") {
        currentCoValue = node.expectCoValueLoaded(
            currentCoValue.header.ruleset.group
        );
    }

    if (currentCoValue.header.ruleset.type !== "group") {
        throw new Error("Can't create invite link for object without group");
    }

    const group = new Group(
        cojsonInternals.expectGroupContent(currentCoValue.getCurrentContent()),
        node
    );

    const inviteSecret = group.createInvite(role);

    return `${baseURL}#invitedTo=${value.id}&${inviteSecret}`;
}

export function parseInviteLink(inviteURL: string):
    | {
          valueID: CoID<ContentType>;
          inviteSecret: InviteSecret;
      }
    | undefined {
    const url = new URL(inviteURL);
    const valueID = url.hash
        .split("&")[0]
        ?.replace(/^#invitedTo=/, "") as CoID<ContentType>;
    const inviteSecret = url.hash.split("&")[1] as InviteSecret;
    if (!valueID || !inviteSecret) {
        return undefined;
    }
    return { valueID, inviteSecret };
}

export function consumeInviteLinkFromWindowLocation(node: LocalNode): Promise<
    | {
          valueID: string;
          inviteSecret: string;
      }
    | undefined
> {
    return new Promise((resolve, reject) => {
        const result = parseInviteLink(window.location.href);

        if (result) {
            node.acceptInvite(result.valueID, result.inviteSecret)
                .then(() => {
                    resolve(result);
                    window.history.replaceState(
                        {},
                        "",
                        window.location.href.replace(/#.*$/, "")
                    );
                })
                .catch(reject);
        } else {
            resolve(undefined);
        }
    });
}
