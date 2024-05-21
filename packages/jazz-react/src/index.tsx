import React, { useEffect, useRef, useState } from "react";
import {
    consumeInviteLinkFromWindowLocation,
    createJazzBrowserContext,
} from "jazz-browser";

import { Account, CoValue, CoValueClass, ID, Me } from "jazz-tools";
import { ReactAuthHook } from "./auth/auth.js";

/** @category Context & Hooks */
export function createJazzReactContext<Acc extends Account>({
    auth: authHook,
    peer,
    storage = "indexedDB",
}: {
    auth: ReactAuthHook<Acc>;
    peer: `wss://${string}` | `ws://${string}`;
    storage?: "indexedDB" | "experimentalOPFSdoNotUseOrYouWillBeFired";
}): {
    Provider: Provider;
    useAccount: UseAccountHook<Acc>;
    useCoState: UseCoStateHook;
    useAcceptInvite: UseAcceptInviteHook;
} {
    const JazzContext = React.createContext<
        | {
              me: Acc & Me;
              logOut: () => void;
          }
        | undefined
    >(undefined);

    function Provider({ children }: { children: React.ReactNode }) {
        const [me, setMe] = useState<(Acc & Me) | undefined>();

        const { auth, AuthUI, logOut } = authHook();

        useEffect(() => {
            let done: (() => void) | undefined = undefined;
            let stop = false;

            (async () => {
                const context = await createJazzBrowserContext<Acc>({
                    auth: auth,
                    peer:
                        (new URLSearchParams(window.location.search).get(
                            "peer"
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
                {me && logOut ? (
                    <JazzContext.Provider
                        value={{
                            me,
                            logOut,
                        }}
                    >
                        {children}
                    </JazzContext.Provider>
                ) : (
                    AuthUI
                )}
            </>
        );
    }

    function useAccount() {
        const context = React.useContext(JazzContext);

        if (!context) {
            throw new Error("useAccount must be used within a JazzProvider");
        }

        const me = useCoState<Acc & Me>(
            context.me.constructor as CoValueClass<Acc & Me>,
            context.me.id
        );

        return { me: me || context.me, logOut: context.logOut };
    }

    function useCoState<V extends CoValue>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Schema: { new (...args: any[]): V } & CoValueClass,
        id: ID<V> | undefined,
        options?: { require?: (value: V) => boolean | undefined }
    ): V | undefined {
        // for some reason (at least in React 18) - if we use state directly,
        // some updates get swallowed/UI doesn't update
        const [_, setUpdates] = useState<number>(0);
        const state = useRef<V | undefined>(undefined);
        const me = React.useContext(JazzContext)?.me;

        useEffect(() => {
            if (!id || !me) return;
            return Schema.subscribe(
                id,
                { as: me, require: options?.require },
                (update) => {
                    state.current = update as V;

                    setUpdates((u) => {
                        return u + 1;
                    });
                }
            );
        }, [Schema, id, me]);

        return state.current;
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
export type Provider = React.FC<{
    children: React.ReactNode;
}>;

/** @category Context & Hooks */
export type UseAccountHook<Acc extends Account> = () => {
    me: Acc & Me;
    logOut: () => void;
};

/** @category Context & Hooks */
export type UseCoStateHook = <V extends CoValue>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Schema: { new (...args: any[]): V } & CoValueClass,
    id: ID<V> | undefined,
    options?: { require?: (value: V) => boolean | undefined }
) => V | undefined;

/** @category Context & Hooks */
export type UseAcceptInviteHook = <V extends CoValue>({
    invitedObjectSchema,
    onAccept,
    forValueHint,
}: {
    invitedObjectSchema: CoValueClass<V>;
    onAccept: (projectID: ID<V>) => void;
    forValueHint?: string;
}) => void;

export { createInviteLink, parseInviteLink } from "jazz-browser";

export * from "./auth/auth.js";
export * from "./media.js";
