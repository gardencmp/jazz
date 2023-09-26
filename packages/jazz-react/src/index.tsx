import {
    LocalNode,
    CoID,
    Queried,
    CoValue,
    BinaryCoStream,
    ControlledAccount,
} from "cojson";
import React, { useEffect, useState } from "react";
import {
    AuthProvider,
    consumeInviteLinkFromWindowLocation,
    createBrowserNode,
} from "jazz-browser";
import { readBlobFromBinaryStream } from "jazz-browser";

const JazzContext = React.createContext<
    | {
          me: ControlledAccount;
          localNode: LocalNode;
          logOut: () => void;
      }
    | undefined
>(undefined);

export type ReactAuthHook = () => {
    auth: AuthProvider;
    AuthUI: React.ReactNode;
    logOut?: () => void;
};

/**
 * Top-level component that provides Jazz context to your whole app, so you can use Jazz hooks in your components.
 *
 * @param props.auth An auth provider (renders login/sign-up UI if not logged in) - see available providers in the [Documentation](../../../DOCS.md#auth-providers)
 *
 * @param props.syncAddress The address of the upstream syncing peer. Defaults to `wss://sync.jazz.tool` (Jazz Global Mesh). If not set explicitly, it can also be temporarily overwritten by setting the `sync` query parameter in the URL, like `https://your-app.example.net?sync=ws://localhost:4200`.
 *
 * @example How to use `WithJazz` with the `jazz-react-auth-local` auth provider:
 *
 * ```typescript
 * import { WithJazz } from "jazz-react";
 * import { LocalAuth } from "jazz-react-auth-local";
 *
 * ReactDOM.createRoot(document.getElementById("root")!).render(
 *    <React.StrictMode>
 *       <WithJazz auth={LocalAuth({ appName: "My App" })}>
 *          <App />
 *      </WithJazz>
 *   </React.StrictMode>
 * );
 * ```
 * */
export function WithJazz(props: {
    auth: ReactAuthHook;
    syncAddress?: string;
    children: React.ReactNode;
}) {
    const { auth: authHook, syncAddress, children } = props;

    const [node, setNode] = useState<LocalNode | undefined>();

    const { auth, AuthUI, logOut } = authHook();

    useEffect(() => {
        let done: (() => void) | undefined = undefined;
        let stop = false;

        (async () => {
            const nodeHandle = await createBrowserNode({
                auth: auth,
                syncAddress:
                    syncAddress ||
                    new URLSearchParams(window.location.search).get("sync") ||
                    undefined,
            });

            if (stop) {
                nodeHandle.done();
                return;
            }

            setNode(nodeHandle.node);

            done = nodeHandle.done;
        })().catch((e) => {
            console.log("Failed to create browser node", e);
        });

        return () => {
            stop = true;
            done && done();
        };
    }, [auth, syncAddress]);

    return (
        <>
            {node && logOut ? (
                <JazzContext.Provider value={{ me: node.account as ControlledAccount, localNode: node, logOut }}>
                    <>{children}</>
                </JazzContext.Provider>
            ) : (
                AuthUI
            )}
        </>
    );
}

/**
 * Hook that exposes the Jazz context provided by `<WithJazz/>`, most importantly the `LocalNode`
 * for the logged in user (which you can use to create `Group`s, and `CoValue`s in those).
 *
 * Also provides a `logOut` function, which invokes the log-out logic of the Auth Provider passed to `<WithJazz/>`.
 */
export function useJazz() {
    const context = React.useContext(JazzContext);

    if (!context) {
        throw new Error("useJazz must be used within a WithJazz provider");
    }

    return context;
}

/**
 * Hook that subscribes to all updates of a given `CoValue` (identified by its `CoID`) and that automatically resolves references to nested `CoValue`s, loading and subscribing to them as well.
 *
 * See `Queried<T>` in `cojson` to see which fields and methods are available on the returned object.
 *
 * @param id The `CoID` of the `CoValue` to subscribe to. Can be undefined (in which case the hook returns undefined).
 */
export function useSyncedQuery<T extends CoValue>(
    id?: CoID<T>
): Queried<T> | undefined {
    const { localNode } = useJazz();

    const [result, setResult] = useState<Queried<T> | undefined>();

    useEffect(() => {
        if (!id) return;
        const unsubscribe = localNode.query(id, setResult);
        return unsubscribe;
    }, [id, localNode]);

    return result;
}

/**
 * Lower-level hook that loads and subscribes to updates of a single `CoValue` (identified by its `CoID`).
 *
 * References to nested `CoValue`s are not automatically resolved, they are returned as `CoID`s.
 *
 * @param id The `CoID` of the `CoValue` to subscribe to. Can be undefined (in which case the hook returns undefined).
 */
export function useSyncedValue<T extends CoValue>(id?: CoID<T>) {
    const [state, setState] = useState<T>();

    const { localNode } = useJazz();

    useEffect(() => {
        if (!id) return;
        let unsubscribe: (() => void) | undefined = undefined;

        let done = false;

        localNode
            .load(id)
            .then((state) => {
                if (done) return;
                unsubscribe = state.subscribe((newState) => {
                    // console.log(
                    //     "Got update",
                    //     id,
                    //     newState.toJSON(),
                    // );
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

/** @deprecated Use the higher-level `useSyncedQuery` or the equivalent `useSyncedValue` instead */
export function useTelepathicState<T extends CoValue>(id?: CoID<T>) {
    return useSyncedValue(id);
}

export function useBinaryStream<C extends BinaryCoStream>(
    streamID?: CoID<C>,
    allowUnfinished?: boolean
): { blob: Blob; blobURL: string } | undefined {
    const { localNode } = useJazz();

    const stream = useSyncedValue(streamID);

    const [blob, setBlob] = useState<
        { blob: Blob; blobURL: string } | undefined
    >();

    useEffect(() => {
        if (!stream) return;
        readBlobFromBinaryStream(stream.id, localNode, allowUnfinished)
            .then((blob) =>
                setBlob(
                    blob && {
                        blob,
                        blobURL: URL.createObjectURL(blob),
                    }
                )
            )
            .catch((e) => console.error("Failed to read binary stream", e));
    }, [stream, localNode]);

    useEffect(() => {
        return () => {
            blob && URL.revokeObjectURL(blob.blobURL);
        };
    }, [blob?.blobURL]);

    return blob;
}

export function useAcceptInvite<C extends CoValue = CoValue>(
    onInvite: (valueID: CoID<C>, valueHint?: string) => void
) {
    const { localNode } = useJazz();

    useEffect(() => {
        const listener = async () => {
            const acceptedInvitation =
                await consumeInviteLinkFromWindowLocation<C>(localNode);

            if (acceptedInvitation) {
                onInvite(acceptedInvitation.valueID);
            }
        };
        window.addEventListener("hashchange", listener);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        listener();

        return () => {
            window.removeEventListener("hashchange", listener);
        };
    }, [localNode]);
}

export { createInviteLink, parseInviteLink } from "jazz-browser";
