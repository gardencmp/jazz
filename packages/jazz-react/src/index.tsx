import React, { useEffect, useRef, useState } from "react";
import {
    AuthProvider,
    consumeInviteLinkFromWindowLocation,
    createBrowserContext,
} from "jazz-browser";

import {
    AccountSchema,
    AccountMigration,
    ID,
    S,
    controlledAccountSym,
    CoValueSchema,
} from "jazz-js";

export function createReactContext<AccountS extends AccountSchema>({
    auth: authHook,
    syncAddress,
    accountSchema,
    migration,
}: {
    auth: ReactAuthHook;
    syncAddress?: string;
    accountSchema: AccountS;
    migration?: AccountMigration<AccountS>;
    apiKey?: string;
}) {
    const JazzContext = React.createContext<
        | {
              me: AccountS[controlledAccountSym];
              logOut: () => void;
          }
        | undefined
    >(undefined);

    function Provider({ children }: { children: React.ReactNode }) {
        const [me, setMe] = useState<
            AccountS[controlledAccountSym] | undefined
        >();

        const { auth, AuthUI, logOut } = authHook();

        useEffect(() => {
            let done: (() => void) | undefined = undefined;
            let stop = false;

            (async () => {
                const context = await createBrowserContext({
                    auth: auth,
                    syncAddress:
                        syncAddress ||
                        new URLSearchParams(window.location.search).get(
                            "sync"
                        ) ||
                        undefined,
                    accountSchema: accountSchema,
                    migration: migration,
                });

                if (stop) {
                    context.done();
                    return;
                }

                const unsubMe = context.me.subscribe(setMe);

                done = () => {
                    unsubMe();
                    context.done();
                };
            })().catch((e) => {
                console.error("Failed to create browser node", e);
            });

            return () => {
                stop = true;
                done && done();
            };
        }, [auth, syncAddress]);

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

        return { me: context.me, logOut: context.logOut };
    }

    function useCoState<V extends CoValueSchema>(
        Schema: V,
        id: ID<S.Schema.To<V>> | undefined
    ): S.Schema.To<V> | undefined {
        // for some reason (at least in React 18) - if we use state directly,
        // some updates get swallowed/UI doesn't update
        const [_, setUpdates] = useState<number>(0);
        const state = useRef<S.Schema.To<V> | undefined>(undefined);
        const { me } = useAccount();

        useEffect(() => {
            if (!id) return;
            return Schema.subscribe(id, { as: me }, (update) => {
                state.current = update as S.Schema.To<V>;
                setUpdates((u) => u + 1);
            });
        }, [Schema, id, me]);

        return state.current;
    }

    function useAcceptInvite<V extends CoValueSchema>({
        invitedObjectSchema,
        onAccept,
        forValueHint,
    }: {
        invitedObjectSchema: V;
        onAccept: (projectID: ID<S.Schema.To<V>>) => void;
        forValueHint?: string;
    }): void {
        const { me } = useAccount();
        useEffect(() => {
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
        JazzProvider: Provider,
        useAccount,
        useCoState,
        useAcceptInvite,
    };
}

export type ReactAuthHook = () => {
    auth: AuthProvider;
    AuthUI: React.ReactNode;
    logOut?: () => void;
};

export { DemoAuth } from "./DemoAuth.js";

export { createInviteLink } from "jazz-browser";
