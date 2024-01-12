import {
    LocalNode,
    CoID,
    CoValue,
    BinaryCoStream,
    Account,
    AccountMeta,
    AccountMigration,
    Profile,
    CoMap,
} from "cojson";
import React, { useEffect, useState } from "react";
import {
    AuthProvider,
    consumeInviteLinkFromWindowLocation,
    createBrowserNode,
    readBlobFromBinaryStream,
} from "jazz-browser";

import { Resolved, ResolvedAccount, autoSub } from "jazz-autosub";
export type { Resolved, ResolvedCoMap } from "jazz-autosub";
export {
    ResolvedAccount,
    ResolvedCoList,
    ResolvedCoMapBase,
    ResolvedCoStream,
    ResolvedGroup,
} from "jazz-autosub";

const JazzContext = React.createContext<
    | {
          me: Resolved<Account>;
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
    migration?: AccountMigration;
    apiKey?: string
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
                migration: props.migration,
            });

            if (stop) {
                nodeHandle.done();
                return;
            }

            setNode(nodeHandle.node);

            done = nodeHandle.done;
        })().catch((e) => {
            console.error("Failed to create browser node", e);
        });

        return () => {
            stop = true;
            done && done();
        };
    }, [auth, syncAddress]);

    const me = useAutoSubWithNode("me", node) as ResolvedAccount | undefined;

    return (
        <>
            {node && me && logOut ? (
                <JazzContext.Provider
                    value={{
                        me,
                        localNode: node,
                        logOut,
                    }}
                >
                    <>{children}</>
                </JazzContext.Provider>
            ) : (
                AuthUI
            )}
        </>
    );
}

/**
 * Hook that exposes the Jazz context provided by `<WithJazz/>`, most importantly `me`, the account of
 * the current in user (which you can use access the account's `root` or `profile`,
 * and to create `Group`s as the current user, in which you can then create `CoValue`s).
 *
 * Also provides a `logOut` function, which invokes the log-out logic of the Auth Provider passed to `<WithJazz/>`.
 */
export function useJazz<
    P extends Profile = Profile,
    R extends CoMap = CoMap,
    Meta extends AccountMeta = AccountMeta
>() {
    const context = React.useContext(JazzContext);

    if (!context) {
        throw new Error("useJazz must be used within a WithJazz provider");
    }

    return {
        me: context.me as ResolvedAccount<Account<P, R, Meta>>,
        localNode: context.localNode,
        logOut: context.logOut,
    };
}

/**
 * Hook that subscribes to all updates of a given `CoValue` (identified by its `CoID`) and that automatically resolves references to nested `CoValue`s, loading and subscribing to them as well.
 *
 * See `Resolved<T>` in `jazz-autosub` to see which fields and methods are available on the returned object.
 *
 * @param id The `CoID` of the `CoValue` to subscribe to. Can be undefined (in which case the hook returns undefined).
 */

export function useAutoSub<T extends CoValue>(
    id?: CoID<T>
): Resolved<T> | undefined;

/**
 * Hook that subscribes to all updates the current user account and that automatically resolves references to nested `CoValue`s, loading and subscribing to them as well.
 *
 * See `Resolved<T>` in `jazz-autosub` to see which fields and methods are available on the returned object.
 *
 */
export function useAutoSub<
    P extends Profile = Profile,
    R extends CoMap = CoMap,
    Meta extends AccountMeta = AccountMeta
>(id: "me"): ResolvedAccount<Account<P, R, Meta>> | undefined;
export function useAutoSub(
    id?: CoID<CoValue> | "me"
): Resolved<CoValue> | ResolvedAccount | undefined {
    return useAutoSubWithNode(id, useJazz().localNode);
}

/** @internal */
function useAutoSubWithNode(
    id?: CoID<CoValue> | "me",
    localNode?: LocalNode
): Resolved<CoValue> | ResolvedAccount | undefined {
    const [result, setResult] = useState<
        Resolved<CoValue> | ResolvedAccount | undefined
    >();

    useEffect(() => {
        if (!id || !localNode) return;
        const unsubscribe = autoSub(id, localNode, setResult);
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
                if (state === "unavailable") return;
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
export { DemoAuth } from './DemoAuth.jsx'
