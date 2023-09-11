import {
    LocalNode,
    CoValueImpl,
    CoID,
    CoMap,
    AccountID,
    JsonValue,
    CojsonInternalTypes,
    BinaryCoStream,
    BinaryCoStreamMeta,
} from "cojson";
import React, { useEffect, useState } from "react";
import { AuthProvider, createBrowserNode } from "jazz-browser";
import { readBlobFromBinaryStream } from "jazz-browser";

export {
    createInviteLink,
    parseInviteLink,
    consumeInviteLinkFromWindowLocation,
} from "jazz-browser";

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
                syncAddress:
                    syncAddress ||
                    new URLSearchParams(window.location.search).get("sync") ||
                    undefined,
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

export function useTelepathicState<T extends CoValueImpl>(id?: CoID<T>) {
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

export function useProfile<
    P extends {
        [key: string]: JsonValue;
    } & CojsonInternalTypes.ProfileContent = CojsonInternalTypes.ProfileContent
>(
    accountID?: AccountID
): CoMap<P, CojsonInternalTypes.ProfileMeta> | undefined {
    const [profileID, setProfileID] =
        useState<CoID<CoMap<P, CojsonInternalTypes.ProfileMeta>>>();

    const { localNode } = useJazz();

    useEffect(() => {
        accountID &&
            localNode
                .loadProfile(accountID)
                .then((profile) => setProfileID(profile.id as typeof profileID))
                .catch((e) => console.log("Failed to load profile", e));
    }, [localNode, accountID]);

    return useTelepathicState(profileID);
}

export function useBinaryStream<C extends BinaryCoStream<BinaryCoStreamMeta>>(
    streamID?: CoID<C>,
    allowUnfinished?: boolean
): { blob: Blob; blobURL: string } | undefined {
    const { localNode } = useJazz();

    const stream = useTelepathicState(streamID);

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
