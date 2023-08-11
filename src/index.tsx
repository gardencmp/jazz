import {
    LocalNode,
    AgentCredential,
    internals as cojsonInternals,
    SessionID,
    AgentID,
    ContentType,
    CoValueID,
    SyncMessage,
} from "cojson";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ReadableStream, WritableStream } from 'isomorphic-streams';

type JazzContext = {
    localNode: LocalNode;
};

const JazzContext = React.createContext<JazzContext | undefined>(undefined);

export type AuthComponent = (props: {
    onCredential: (credentials: AgentCredential) => void;
}) => React.ReactElement;

export function WithJazz({
    children,
    auth: Auth,
}: {
    children: React.ReactNode;
    auth: AuthComponent;
}) {
    const [node, setNode] = useState<LocalNode | undefined>();
    const sessionDone = useRef<() => void>();

    const onCredential = useCallback((credential: AgentCredential) => {
        const agentID = cojsonInternals.getAgentID(
            cojsonInternals.getAgent(credential)
        );
        const sessionHandle = getSessionFor(agentID);

        sessionHandle.session.then((sessionID) =>
            setNode(new LocalNode(credential, sessionID))
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
            const ws = new WebSocket("ws://localhost:4200");

            const incoming = websocketReadableStream<SyncMessage>(ws);
            const outgoing = websocketWritableStream<SyncMessage>(ws);

            node.sync.addPeer({
                id: "localhost@" + (new Date()).toISOString(),
                incoming,
                outgoing,
                role: "server"
            });
        }
    }, [node]);

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

export function useTelepathicState<T extends ContentType>(id: CoValueID<T>) {
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
        ws.onmessage = event => controller.enqueue(JSON.parse(event.data));
        ws.onclose = () => controller.close();
        ws.onerror = () => controller.error(new Error("The WebSocket errored!"));
      },

      cancel() {
        ws.close();
      }
    });
  }

  function websocketWritableStream<T>(ws: WebSocket) {

    return new WritableStream<T>({
      start(controller) {
        ws.onerror = () => {
          controller.error(new Error("The WebSocket errored!"));
          ws.onclose = null;
        };
        ws.onclose = () => controller.error(new Error("The server closed the connection unexpectedly!"));
        return new Promise(resolve => ws.onopen = resolve);
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
        ws.onclose = e => {
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