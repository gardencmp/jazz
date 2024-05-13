import { ReadableStream, WritableStream } from "isomorphic-streams";
import {
    CoValue,
    ID,
    Peer,
    AgentID,
    SessionID,
    SyncMessage,
    cojsonInternals,
    InviteSecret,
    Account,
    CoValueClass,
    Me,
    jazzReady,
} from "jazz-tools";
import { AccountID } from "cojson";
import { AuthProvider } from "./auth/auth.js";
import {
    BlockFilename,
    FSErr,
    FileSystem,
    LSMStorage,
} from "cojson-storage-lsm";
import { Effect } from "effect";
export * from "./auth/auth.js";

/** @category Context Creation */
export type BrowserContext<A extends Account> = {
    me: A & Me;
    // TODO: Symbol.dispose?
    done: () => void;
};

/** @category Context Creation */
export async function createJazzBrowserContext<Acc extends Account>({
    auth,
    peer,
    reconnectionTimeout: initialReconnectionTimeout = 500,
}: {
    auth: AuthProvider<Acc>;
    peer: `wss://${string}` | `ws://${string}`;
    reconnectionTimeout?: number;
}): Promise<BrowserContext<Acc>> {
    await jazzReady;
    let sessionDone: () => void;

    const firstWsPeer = createWebSocketPeer(peer);
    let shouldTryToReconnect = true;

    let currentReconnectionTimeout = initialReconnectionTimeout;

    function onOnline() {
        console.log("Online, resetting reconnection timeout");
        currentReconnectionTimeout = initialReconnectionTimeout;
    }

    window.addEventListener("online", onOnline);

    const opfsWorkerJSSrc = `

    let rootDirHandle;
    const handlesByRequest = new Map();
    const handlesByFilename = new Map();

    onmessage = async (event) => {
        rootDirHandle = rootDirHandle || await navigator.storage.getDirectory();
        console.log("Received in OPFS worker", {...event.data, data: event.data.data ? "some data of length " + event.data.data.length : undefined});
        if (event.data.type === "listFiles") {
            const fileNames = [];
            for await (const entry of rootDirHandle.values()) {
                if (entry.kind === "file") {
                    fileNames.push(entry.name);
                }
            }
            postMessage({requestId: event.data.requestId, fileNames});
        } else if (event.data.type === "openToRead" || event.data.type === "openToWrite") {
            let syncHandle;
            const existingHandle = handlesByFilename.get(event.data.filename);
            if (existingHandle) {
                syncHandle = existingHandle;
            } else {
                const handle = await rootDirHandle.getFileHandle(event.data.filename);
                syncHandle = await handle.createSyncAccessHandle();
            }
            handlesByRequest.set(event.data.requestId, syncHandle);
            handlesByFilename.set(event.data.filename, syncHandle);
            postMessage({requestId: event.data.requestId, handle: event.data.requestId, size: syncHandle.getSize()});
        } else if (event.data.type === "createFile") {
            const handle = await rootDirHandle.getFileHandle(event.data.filename, {
                create: true,
            });
            const syncHandle = await handle.createSyncAccessHandle();
            handlesByRequest.set(event.data.requestId, syncHandle);
            handlesByFilename.set(event.data.filename, syncHandle);
            postMessage({requestId: event.data.requestId, handle: event.data.requestId, result: "done"});
        } else if (event.data.type === "append") {
            const writable = handlesByRequest.get(event.data.handle);
            writable.write(event.data.data, {at: writable.getSize()});
            writable.flush();
            postMessage({requestId: event.data.requestId, result: "done"});
        } else if (event.data.type === "read") {
            const readable = handlesByRequest.get(event.data.handle);
            const buffer = new Uint8Array(event.data.length);
            const read = readable.read(buffer, {at: event.data.offset});
            if (read < event.data.length) {
                throw new Error("Couldn't read enough");
            }
            postMessage({requestId: event.data.requestId, data: buffer, result: "done"});
        } else if (event.data.type === "renameAndClose") {
            const handle = handlesByRequest.get(event.data.handle);
            const newHandle = await rootDirHandle.getFileHandle(event.data.filename, { create: true });
            const writable = await newHandle.createSyncAccessHandle();
            writable.write(handle.read(new Uint8Array(handle.getSize())));
            writable.flush();
            writable.close();
            postMessage({requestId: event.data.requestId, result: "done"});
        } else {
            console.error("Unknown event type", event.data.type);
        }
    };

    //# sourceURL=opfsWorker.js
    `;

    const opfsWorker = new Worker(
        URL.createObjectURL(
            new Blob([opfsWorkerJSSrc], { type: "text/javascript" })
        )
    );

    class OPFSFilesystem implements FileSystem<number, number> {
        opfsWorker: Worker;
        callbacks: Map<number, (event: MessageEvent) => void> = new Map();
        nextRequestId = 0;

        constructor(opfsWorker: Worker) {
            this.opfsWorker = opfsWorker;
            opfsWorker.onmessage = (event) => {
                // console.log("Received from OPFS worker", event.data);
                const handler = this.callbacks.get(event.data.requestId);
                if (handler) {
                    handler(event);
                    this.callbacks.delete(event.data.requestId);
                }
            };
        }

        listFiles(): Effect.Effect<string[], FSErr, never> {
            return Effect.async((cb) => {
                const requestId = this.nextRequestId++;
                this.callbacks.set(requestId, (event) => {
                    cb(Effect.succeed(event.data.fileNames));
                });
                this.opfsWorker.postMessage({ type: "listFiles", requestId });
            });
        }

        openToRead(
            filename: string
        ): Effect.Effect<{ handle: number; size: number }, FSErr, never> {
            return Effect.async((cb) => {
                const requestId = this.nextRequestId++;
                this.callbacks.set(requestId, (event) => {
                    cb(
                        Effect.succeed({
                            handle: event.data.handle,
                            size: event.data.size,
                        })
                    );
                });
                this.opfsWorker.postMessage({
                    type: "openToRead",
                    filename,
                    requestId,
                });
            });
        }

        createFile(filename: string): Effect.Effect<number, FSErr, never> {
            return Effect.async((cb) => {
                const requestId = this.nextRequestId++;
                this.callbacks.set(requestId, (event) => {
                    cb(Effect.succeed(event.data.handle));
                });
                this.opfsWorker.postMessage({
                    type: "createFile",
                    filename,
                    requestId,
                });
            });
        }

        openToWrite(
            filename: string
        ): Effect.Effect<FileSystemFileHandle, FSErr, never> {
            return Effect.async((cb) => {
                const requestId = this.nextRequestId++;
                this.callbacks.set(requestId, (event) => {
                    cb(Effect.succeed(event.data.handle));
                });
                this.opfsWorker.postMessage({
                    type: "openToWrite",
                    filename,
                    requestId,
                });
            });
        }

        append(
            handle: number,
            data: Uint8Array
        ): Effect.Effect<void, FSErr, never> {
            return Effect.async((cb) => {
                const requestId = this.nextRequestId++;
                this.callbacks.set(requestId, (_) => {
                    cb(Effect.succeed(undefined));
                });
                this.opfsWorker.postMessage({
                    type: "append",
                    handle,
                    data,
                    requestId,
                });
            });
        }

        read(
            handle: number,
            offset: number,
            length: number
        ): Effect.Effect<Uint8Array, FSErr, never> {
            return Effect.async((cb) => {
                const requestId = this.nextRequestId++;
                this.callbacks.set(requestId, (event) => {
                    cb(Effect.succeed(event.data.data));
                });
                this.opfsWorker.postMessage({
                    type: "read",
                    handle,
                    offset,
                    length,
                    requestId,
                });
            });
        }

        renameAndClose(
            handle: number,
            filename: BlockFilename
        ): Effect.Effect<void, FSErr, never> {
            return Effect.async((cb) => {
                const requestId = this.nextRequestId++;
                this.callbacks.set(requestId, () => {
                    cb(Effect.succeed(undefined));
                });
                this.opfsWorker.postMessage({
                    type: "renameAndClose",
                    handle,
                    filename,
                    requestId,
                });
            });
        }
    }

    const me = await auth.createOrLoadAccount(
        (accountID) => {
            const sessionHandle = getSessionHandleFor(accountID);
            sessionDone = sessionHandle.done;
            return sessionHandle.session;
        },
        [
            await LSMStorage.asPeer({
                fs: new OPFSFilesystem(opfsWorker),
                trace: true,
            }),
            firstWsPeer,
        ]
    );

    async function websocketReconnectLoop() {
        while (shouldTryToReconnect) {
            if (
                Object.keys(me._raw.core.node.syncManager.peers).some(
                    (peerId) => peerId.includes(peer)
                )
            ) {
                // TODO: this might drain battery, use listeners instead
                await new Promise((resolve) => setTimeout(resolve, 100));
            } else {
                console.log(
                    "Websocket disconnected, trying to reconnect in " +
                        currentReconnectionTimeout +
                        "ms"
                );
                currentReconnectionTimeout = Math.min(
                    currentReconnectionTimeout * 2,
                    30000
                );
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, currentReconnectionTimeout);
                    window.addEventListener(
                        "online",
                        () => {
                            console.log(
                                "Online, trying to reconnect immediately"
                            );
                            resolve();
                        },
                        { once: true }
                    );
                });

                me._raw.core.node.syncManager.addPeer(
                    createWebSocketPeer(peer)
                );
            }
        }
    }

    void websocketReconnectLoop();

    return {
        me,
        done: () => {
            shouldTryToReconnect = false;
            window.removeEventListener("online", onOnline);
            console.log("Cleaning up node");
            for (const peer of Object.values(
                me._raw.core.node.syncManager.peers
            )) {
                peer.outgoing
                    .close()
                    .catch((e) => console.error("Error while closing peer", e));
            }
            sessionDone?.();
        },
    };
}

/** @category Auth Providers */
export type SessionProvider = (
    accountID: ID<Account> | AgentID
) => Promise<SessionID>;

/** @category Auth Providers */
export type SessionHandle = {
    session: Promise<SessionID>;
    done: () => void;
};

export function getSessionHandleFor(
    accountID: ID<Account> | AgentID
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
                // console.debug("Trying to get lock", accountID + "_" + idx);
                const sessionFinishedOrNoLock = await navigator.locks.request(
                    accountID + "_" + idx,
                    { ifAvailable: true },
                    async (lock) => {
                        if (!lock) return "noLock";

                        const sessionID =
                            localStorage[accountID + "_" + idx] ||
                            cojsonInternals.newRandomSessionID(
                                accountID as AccountID | AgentID
                            );
                        localStorage[accountID + "_" + idx] = sessionID;

                        // console.debug(
                        //     "Got lock",
                        //     accountID + "_" + idx,
                        //     sessionID
                        // );

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

                if (pingTimeout) {
                    clearTimeout(pingTimeout);
                }

                pingTimeout = setTimeout(() => {
                    console.debug("Ping timeout");
                    try {
                        controller.close();
                        ws.close();
                    } catch (e) {
                        console.error(
                            "Error while trying to close ws on ping timeout",
                            e
                        );
                    }
                }, 2500);

                if (msg.type === "ping") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).jazzPings = (window as any).jazzPings || [];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).jazzPings.push({
                        received: Date.now(),
                        sent: msg.time,
                        dc: msg.dc,
                    });
                    return;
                }
                controller.enqueue(msg);
            };
            const closeListener = () => {
                controller.close();
                clearTimeout(pingTimeout);
            };
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

export function createWebSocketPeer(syncAddress: string): Peer {
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

/** @category Invite Links */
export function createInviteLink<C extends CoValue>(
    value: C,
    role: "reader" | "writer" | "admin",
    // default to same address as window.location, but without hash
    {
        baseURL = window.location.href.replace(/#.*$/, ""),
        valueHint,
    }: { baseURL?: string; valueHint?: string } = {}
): string {
    const coValueCore = value._raw.core;
    let currentCoValue = coValueCore;

    while (currentCoValue.header.ruleset.type === "ownedByGroup") {
        currentCoValue = currentCoValue.getGroup().core;
    }

    if (currentCoValue.header.ruleset.type !== "group") {
        throw new Error("Can't create invite link for object without group");
    }

    const group = cojsonInternals.expectGroup(
        currentCoValue.getCurrentContent()
    );
    const inviteSecret = group.createInvite(role);

    return `${baseURL}#/invite/${valueHint ? valueHint + "/" : ""}${
        value.id
    }/${inviteSecret}`;
}

/** @category Invite Links */
export function parseInviteLink<C extends CoValue>(
    inviteURL: string
):
    | {
          valueID: ID<C>;
          valueHint?: string;
          inviteSecret: InviteSecret;
      }
    | undefined {
    const url = new URL(inviteURL);
    const parts = url.hash.split("/");

    let valueHint: string | undefined;
    let valueID: ID<C> | undefined;
    let inviteSecret: InviteSecret | undefined;

    if (parts[0] === "#" && parts[1] === "invite") {
        if (parts.length === 5) {
            valueHint = parts[2];
            valueID = parts[3] as ID<C>;
            inviteSecret = parts[4] as InviteSecret;
        } else if (parts.length === 4) {
            valueID = parts[2] as ID<C>;
            inviteSecret = parts[3] as InviteSecret;
        }

        if (!valueID || !inviteSecret) {
            return undefined;
        }
        return { valueID, inviteSecret, valueHint };
    }
}

/** @category Invite Links */
export function consumeInviteLinkFromWindowLocation<V extends CoValue>({
    as,
    forValueHint,
    invitedObjectSchema,
}: {
    as: Account & Me;
    forValueHint?: string;
    invitedObjectSchema: CoValueClass<V>;
}): Promise<
    | {
          valueID: ID<V>;
          valueHint?: string;
          inviteSecret: InviteSecret;
      }
    | undefined
> {
    return new Promise((resolve, reject) => {
        const result = parseInviteLink<V>(window.location.href);

        if (result && result.valueHint === forValueHint) {
            as.acceptInvite(
                result.valueID,
                result.inviteSecret,
                invitedObjectSchema
            )
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
