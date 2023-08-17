import { LocalNode, ContentType, CoID } from "cojson";
import React, { useEffect, useState } from "react";
import { AuthProvider, createBrowserNode } from "jazz-browser";

type JazzContext = {
    localNode: LocalNode;
    logOut: () => void;
};

const JazzContext = React.createContext<JazzContext | undefined>(undefined);

export type ReactAuthHook = () => {
    auth: AuthProvider;
    AuthUI: React.ReactNode;
    logOut?: () => void;
};

export function WithJazz({
    children,
    auth: authHook,
    syncAddress,
}: {
    children: React.ReactNode;
    auth: ReactAuthHook;
    syncAddress?: string;
}) {
    const [node, setNode] = useState<LocalNode | undefined>();

    const { auth, AuthUI, logOut } = authHook();

    useEffect(() => {
        let done: (() => void) | undefined = undefined;

        (async () => {
            const nodeHandle = await createBrowserNode({
                auth: auth,
                syncAddress,
            });

            setNode(nodeHandle.node);

            done = nodeHandle.done;
        })().catch((e) => {
            console.log("Failed to create browser node", e);
        });

        return () => {
            done && done();
        };
    }, [auth, syncAddress]);

    return (
        <>
            {node && logOut ? (
                <JazzContext.Provider value={{ localNode: node, logOut }}>
                    <>{children}</>
                </JazzContext.Provider>
            ) : (
                AuthUI
            )}
        </>
    );
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

        localNode
            .load(id)
            .then((state) => {
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
            })
            .catch((e) => {
                console.log("Failed to load", id, e);
            });

        return () => {
            done = true;
            unsubscribe && unsubscribe();
        };
    }, [localNode, id]);

    return state;
}
