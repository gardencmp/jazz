import React, { useEffect, useState } from "react";
import {
    AuthProvider,
    consumeInviteLinkFromWindowLocation,
    createBrowserContext,
    readBlobFromBinaryStream,
} from "jazz-browser";

import {
    AccountSchema,
    AccountMigration,
    ControlledAccount,
    CoValueSchema,
    ID,
} from "jazz-js";
import { DemoAuth } from "./DemoAuth";

export function createReactContext<AccountS extends AccountSchema>({
    auth: authHook,
    syncAddress,
    accountSchema,
    migration,
    apiKey,
}: {
    auth: ReactAuthHook;
    syncAddress?: string;
    accountSchema: AccountS;
    migration?: AccountMigration<AccountS>;
    apiKey?: string;
}) {
    const JazzContext = React.createContext<
        | {
              me: AccountS["ControlledSchema"]["_Value"];
              logOut: () => void;
          }
        | undefined
    >(undefined);

    function Provider({ children }: { children: React.ReactNode }) {
        const [controlledAccount, setControlledAccount] = useState<
            AccountS["ControlledSchema"]["_Value"] | undefined
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

                setControlledAccount(context.me);

                done = context.done;
            })().catch((e) => {
                console.error("Failed to create browser node", e);
            });

            return () => {
                stop = true;
                done && done();
            };
        }, [auth, syncAddress]);

        const [me, setMe] = useState<AccountS["ControlledSchema"]["_Value"]>();

        useEffect(() => {
            const unsub = controlledAccount?.subscribe((newMe) => setMe(newMe));

            return unsub;
        }, [controlledAccount]);

        return (
            <>
                {controlledAccount && me && logOut ? (
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

    function useCoState<S extends CoValueSchema>(
        schema: S,
        id: ID<S["_Value"]> | undefined
    ): S["_Value"] | undefined {
        return undefined;
    }

    function useAcceptInvite<S extends CoValueSchema>(
{ invitedObjectSchema, onAccept, forValueHint }: { invitedObjectSchema: S; onAccept: (projectID: ID<S['_Value']>) => void; forValueHint?: string; }    ): void {
        const { me } = useAccount();
        useEffect(() => {
            const result = consumeInviteLinkFromWindowLocation({
                as: me,
                invitedObjectSchema,
                forValueHint
            });

            result.then(result => result && onAccept(result?.valueID)).catch((e) => {
                console.error("Failed to accept invite", e);
            });
        }, [onAccept]);
    }

    return {
        JazzProvider: Provider,
        useAccount,
        useCoState,
        useAcceptInvite
    };
}

export type ReactAuthHook = () => {
    auth: AuthProvider;
    AuthUI: React.ReactNode;
    logOut?: () => void;
};

export { DemoAuth } from "./DemoAuth.js";

export { createInviteLink } from 'jazz-browser'