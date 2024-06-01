import React, { useEffect, useState } from "react";
import {
    consumeInviteLinkFromWindowLocation,
    createJazzBrowserContext,
} from "jazz-browser";

import {
    Account,
    CoValue,
    CoValueClass,
    DeeplyLoaded,
    DepthsIn,
    ID,
    subscribeToCoValue,
} from "jazz-tools";
import { AuthState, ReactAuthHook } from "./auth/auth.js";

/** @category Context & Hooks */
export function createJazzReactContext<Acc extends Account>({
    auth: useAuthHook,
    peer,
    storage = "indexedDB",
}: {
    auth: ReactAuthHook<Acc>;
    peer: `wss://${string}` | `ws://${string}`;
    storage?: "indexedDB" | "experimentalOPFSdoNotUseOrYouWillBeFired";
}): JazzReactContext<Acc> {
    const JazzContext = React.createContext<
        | {
              me: Acc;
              logOut: () => void;
          }
        | undefined
    >(undefined);

    function Provider({
        children,
        loading,
    }: {
        children: React.ReactNode;
        loading?: React.ReactNode;
    }) {
        const [me, setMe] = useState<Acc | undefined>();
        const [authState, setAuthState] = useState<AuthState>("loading");
        const { auth, AuthUI, logOut } = useAuthHook(setAuthState);

        useEffect(() => {
            let done: (() => void) | undefined = undefined;
            let stop = false;

            (async () => {
                const context = await createJazzBrowserContext<Acc>({
                    auth: auth,
                    peer:
                        (new URLSearchParams(window.location.search).get(
                            "peer",
                        ) as typeof peer) || peer,
                    storage,
                });

                if (stop) {
                    context.done();
                    return;
                }

                setMe(context.me);

                done = () => {
                    context.done();
                };
            })().catch((e) => {
                console.error("Failed to create browser node", e);
            });

            return () => {
                stop = true;
                done && done();
            };
        }, [auth]);

        return (
            <>
                {authState === "loading" ? loading : null}
                {authState === "signedIn" && me && logOut ? (
                    <JazzContext.Provider
                        value={{
                            me,
                            logOut,
                        }}
                    >
                        {children}
                    </JazzContext.Provider>
                ) : null}
                {authState === "ready" && AuthUI}
            </>
        );
    }

    function useAccount(): { me: Acc; logOut: () => void };
    function useAccount<D extends DepthsIn<Acc>>(
        depth: D,
    ): { me: DeeplyLoaded<Acc, D> | undefined; logOut: () => void };
    function useAccount<D extends DepthsIn<Acc>>(
        depth?: D,
    ): { me: Acc | DeeplyLoaded<Acc, D> | undefined; logOut: () => void } {
        const context = React.useContext(JazzContext);

        if (!context) {
            throw new Error("useAccount must be used within a JazzProvider");
        }

        const me = useCoState<Acc, D>(
            context.me.constructor as CoValueClass<Acc>,
            context.me.id,
            depth,
        );

        return {
            me: depth === undefined ? me || context.me : me,
            logOut: context.logOut,
        };
    }

    function useCoState<V extends CoValue, D>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Schema: CoValueClass<V>,
        id: ID<V> | undefined,
        depth: D & DepthsIn<V> = [] as D & DepthsIn<V>,
    ): DeeplyLoaded<V, D> | undefined {
        const [state, setState] = useState<{
            value: DeeplyLoaded<V, D> | undefined;
        }>({ value: undefined });
        const me = React.useContext(JazzContext)?.me;

        useEffect(() => {
            if (!id || !me) return;

            return subscribeToCoValue(Schema, id, me, depth, (value) => {
                setState({ value });
            });
        }, [Schema, id, me]);

        return state.value;
    }

    function useAcceptInvite<V extends CoValue>({
        invitedObjectSchema,
        onAccept,
        forValueHint,
    }: {
        invitedObjectSchema: CoValueClass<V>;
        onAccept: (projectID: ID<V>) => void;
        forValueHint?: string;
    }): void {
        const me = React.useContext(JazzContext)?.me;
        useEffect(() => {
            if (!me) return;

            const result = consumeInviteLinkFromWindowLocation({
                as: me,
                invitedObjectSchema,
                forValueHint,
            });

            result
                .then((result) => result && onAccept(result?.valueID))
                .catch((e) => {
                    console.error("Failed to accept invite", e);
                });
        }, [onAccept]);
    }

    return {
        Provider,
        useAccount,
        useCoState,
        useAcceptInvite,
    };
}

/** @category Context & Hooks */
export interface JazzReactContext<Acc extends Account> {
    /** @category Provider Component */
    Provider: React.FC<{
        children: React.ReactNode;
        loading?: React.ReactNode;
    }>;

    /** @category Hooks */
    useAccount(): {
        me: Acc;
        logOut: () => void;
    };
    /** @category Hooks */
    useAccount<D extends DepthsIn<Acc>>(
        depth: D,
    ): {
        me: DeeplyLoaded<Acc, D> | undefined;
        logOut: () => void;
    };

    /** @category Hooks */
    useCoState<V extends CoValue, D>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Schema: { new (...args: any[]): V } & CoValueClass,
        id: ID<V> | undefined,
        depth?: D & DepthsIn<V>,
    ): DeeplyLoaded<V, D> | undefined;

    /** @category Hooks */
    useAcceptInvite<V extends CoValue>({
        invitedObjectSchema,
        onAccept,
        forValueHint,
    }: {
        invitedObjectSchema: CoValueClass<V>;
        onAccept: (projectID: ID<V>) => void;
        forValueHint?: string;
    }): void;
}

export { createInviteLink, parseInviteLink } from "jazz-browser";

export * from "./auth/auth.js";
export * from "./media.js";
