import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
    CoValueID,
    ContentType,
    LocalNode,
    internals as cojsonInternals,
} from "cojson";
import { Button } from "./components/ui/button.tsx";
import { Input } from "./components/ui/input.tsx";
import { AgentCredential } from "cojson/src/coValue.ts";
import { AgentID, SessionID } from "cojson/src/ids.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <WithJazz auth={LocalAuth}>
            <App />
        </WithJazz>
    </React.StrictMode>
);

type JazzContext = {
    localNode: LocalNode;
};

const JazzContext = React.createContext<JazzContext | undefined>(undefined);

export function WithJazz({
    children,
    auth: Auth,
}: {
    children: React.ReactNode;
    auth: (props: {
        onCredential: (credentials: AgentCredential) => void;
    }) => React.ReactElement;
}) {
    const [node, setNode] = useState<LocalNode | undefined>();
    const sessionDone = useRef<() => void>();

    const onCredential = useCallback((credential: AgentCredential) => {
        const agentID = cojsonInternals.getAgentID(
            cojsonInternals.getAgent(credential)
        );
        const sessionHandle = getSessionFor(agentID);

        sessionHandle.session.then(sessionID => setNode(new LocalNode(credential, sessionID)));

        sessionDone.current = sessionHandle.done;
    }, []);

    useEffect(() => {
        return () => {
            sessionDone.current && sessionDone.current();
        };
    }, []);

    return node ? (
        <JazzContext.Provider value={{ localNode: node }}>
            <>{children}</>
        </JazzContext.Provider>
    ) : (
        <Auth onCredential={onCredential} />
    );
}

function LocalAuth({
    onCredential,
}: {
    onCredential: (credentials: AgentCredential) => void;
}) {
    const [displayName, setDisplayName] = useState<string>("");

    useEffect(() => {
        if (sessionStorage.credential) {
            const credential = JSON.parse(sessionStorage.credential);
            onCredential(credential);
        }
    }, [onCredential]);

    const signUp = useCallback(() => {
        (async function () {
            const credential = cojsonInternals.newRandomAgentCredential();

            console.log(credential);

            const webAuthNCredential = await navigator.credentials.create({
                publicKey: {
                    challenge: Uint8Array.from([0, 1, 2]),
                    rp: {
                        name: "TodoApp",
                        id: "localhost",
                    },
                    user: {
                        id: cojsonInternals.agentCredentialToBytes(credential),
                        name: displayName,
                        displayName: displayName,
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                    },
                    timeout: 60000,
                    attestation: "direct",
                },
            });

            console.log(
                webAuthNCredential,
                credential,
                cojsonInternals.agentCredentialToBytes(credential)
            );

            sessionStorage.credential = JSON.stringify(credential);
            onCredential(credential);
        })();
    }, [displayName]);

    const signIn = useCallback(() => {
        (async function () {
            const webAuthNCredential = await navigator.credentials.get({
                publicKey: {
                    challenge: Uint8Array.from([0, 1, 2]),
                    rpId: "localhost",
                    allowCredentials: [],
                    timeout: 60000,
                },
            });

            const userIdBytes = new Uint8Array(
                (webAuthNCredential as any).response.userHandle
            );
            const credential =
                cojsonInternals.agentCredentialFromBytes(userIdBytes);

            if (!credential) {
                throw new Error("Invalid credential");
            }

            sessionStorage.credential = JSON.stringify(credential);
            onCredential(credential);
        })();
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-72 flex flex-col gap-4">
                <form
                    className="w-72 flex flex-col gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        signUp();
                    }}
                >
                    <Input
                        placeholder="Display name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        autoComplete="webauthn"
                    />
                    <Button asChild>
                        <Input type="submit" value="Sign Up as new account" />
                    </Button>
                </form>
                <Button onClick={signIn}>Log In with existing account</Button>
            </div>
        </div>
    );
}

type SessionHandle = {
    session: Promise<SessionID>,
    done: () => void,
}

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
                const sessionFinishedOrNoLock = await navigator.locks.request(agentID + "_" + idx, {ifAvailable: true}, async (lock) => {
                    if (!lock) return "noLock";

                    const sessionID = localStorage[agentID + "_" + idx] || cojsonInternals.newRandomSessionID(agentID);
                    localStorage[agentID + "_" + idx] = sessionID;

                    console.log("Got lock", agentID + "_" + idx, sessionID);

                    resolveSession(sessionID);

                    await donePromise;
                    console.log("Done with lock", agentID + "_" + idx, sessionID);
                    return "sessionFinished"
                });

                if (sessionFinishedOrNoLock === "sessionFinished") {
                    return;
                }
            }
        }
        throw new Error("Couldn't get lock on session after 100x2 tries")
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
