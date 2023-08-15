import {
    LocalNode,
    internals as cojsonInternals,
    SessionID,
    ContentType,
    SyncMessage,
    AgentSecret,
} from "cojson";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ReadableStream, WritableStream } from "isomorphic-streams";
import { CoID } from "cojson";
import { AgentID } from "cojson/src/ids";
import { getAgentID } from "cojson/src/crypto";
import { AnonymousControlledAccount } from "cojson/src/account";
import { IDBStorage } from "jazz-storage-indexeddb";

type JazzContext = {
    localNode: LocalNode;
};

const JazzContext = React.createContext<JazzContext | undefined>(undefined);

export type AuthComponent = (props: {
    onCredential: (credentials: AgentSecret) => void;
}) => React.ReactElement;

export function WithJazz({
    children,
    auth: Auth,
    syncAddress = "wss://sync.jazz.tools",
}: {
    children: React.ReactNode;
    auth: AuthComponent;
    syncAddress?: string;
}) {
    const [node, setNode] = useState<LocalNode | undefined>();
    const sessionDone = useRef<() => void>();

    const onCredential = useCallback((credential: AgentSecret) => {
        const agentID = getAgentID(
            credential
        );
        const sessionHandle = getSessionFor(agentID);

        sessionHandle.session.then((sessionID) =>
            setNode(new LocalNode(new AnonymousControlledAccount(credential), sessionID))
        );

        sessionDone.current = sessionHandle.done;
    }, []);

    useEffect(() => {
        return () => {
            sessionDone.current && sessionDone.current();
        };
    }, []);

    useEffect(() => {
        if (node) {
            IDBStorage.connectTo(node, {trace: true})

            let shouldTryToReconnect = true;
            let ws: WebSocket | undefined;

            (async function websocketReconnectLoop() {
                while (shouldTryToReconnect) {
                    ws = new WebSocket(syncAddress);

                    const timeToReconnect = new Promise<void>((resolve) => {
                        if (
                            !ws ||
                            ws.readyState === WebSocket.CLOSING ||
                            ws.readyState === WebSocket.CLOSED
                        )
                            resolve();
                        ws?.addEventListener(
                            "close",
                            () => {
                                console.log(
                                    "Connection closed, reconnecting in 5s"
                                );
                                setTimeout(resolve, 5000);
                            },
                            { once: true }
                        );
                    });

                    const incoming = websocketReadableStream<SyncMessage>(ws);
                    const outgoing = websocketWritableStream<SyncMessage>(ws);

                    node.sync.addPeer({
                        id: syncAddress + "@" + new Date().toISOString(),
                        incoming,
                        outgoing,
                        role: "server",
                    });

                    await timeToReconnect;
                }
            })();

            return () => {
                shouldTryToReconnect = false;
                ws?.close();
            };
        }
    }, [node, syncAddress]);

    return node ? (
        <JazzContext.Provider value={{ localNode: node }}>
            <>{children}</>
        </JazzContext.Provider>
    ) : (
        <Auth onCredential={onCredential} />
    );
}

type SessionHandle = {
    session: Promise<SessionID>;
    done: () => void;
};

function getSessionFor(agentID: AgentID): SessionHandle {
    let done!: () => void;
    const donePromise = new Promise<void>((resolve) => {
        done = resolve;
    });

    let resolveSession: (sessionID: SessionID) => void;
    const sessionPromise = new Promise<SessionID>((resolve) => {
        resolveSession = resolve;
    });

    (async function () {
        for (let idx = 0; idx < 100; idx++) {
            // To work better around StrictMode
            for (let retry = 0; retry < 2; retry++) {
                console.log("Trying to get lock", agentID + "_" + idx);
                const sessionFinishedOrNoLock = await navigator.locks.request(
                    agentID + "_" + idx,
                    { ifAvailable: true },
                    async (lock) => {
                        if (!lock) return "noLock";

                        const sessionID =
                            localStorage[agentID + "_" + idx] ||
                            cojsonInternals.newRandomSessionID(agentID);
                        localStorage[agentID + "_" + idx] = sessionID;

                        console.log("Got lock", agentID + "_" + idx, sessionID);

                        resolveSession(sessionID);

                        await donePromise;
                        console.log(
                            "Done with lock",
                            agentID + "_" + idx,
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

export function useJazz() {
    const context = React.useContext(JazzContext);

    if (!context) {
        throw new Error("useJazz must be used within a WithJazz provider");
    }

    return context;
}

export function useTelepathicState<T extends ContentType>(id: CoID<T>) {
    const [state, setState] = useState<T>();

    const { localNode } = useJazz();

    useEffect(() => {
        let unsubscribe: (() => void) | undefined = undefined;

        let done = false;

        localNode.load(id).then((state) => {
            if (done) return;
            unsubscribe = state.subscribe((newState) => {
                console.log(
                    "Got update",
                    id,
                    newState.toJSON(),
                    newState.coValue.sessions
                );
                setState(newState as T);
            });
        });

        return () => {
            done = true;
            unsubscribe && unsubscribe();
        };
    }, [localNode, id]);

    return state;
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
