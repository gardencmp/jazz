import React, { useContext, useEffect, useState } from "react";
import {
    consumeInviteLinkFromWindowLocation,
    createJazzBrowserContext,
} from "jazz-browser";

import {
    Account,
    AccountClass,
    CoValue,
    CoValueClass,
    DeeplyLoaded,
    DepthsIn,
    ID,
    subscribeToCoValue,
} from "jazz-tools";
import { AuthMethodCtx } from "./auth/auth.js";

/** @category Context & Hooks */
export function createJazzReactApp<Acc extends Account>({
    AccountSchema = Account as unknown as AccountClass<Acc>,
}: {
    AccountSchema?: AccountClass<Acc>;
} = {}): JazzReactContext<Acc> {
    const JazzContext = React.createContext<Acc | undefined>(undefined);

    function Provider({
        children,
        peer,
        storage,
    }: {
        children: React.ReactNode;
        peer: `wss://${string}` | `ws://${string}`;
        storage?: "indexedDB" | "singleTabOPFS";
    }) {
        const [me, setMe] = useState<Acc | undefined>();
        const auth = useContext(AuthMethodCtx);

        if (!auth) {
            throw new Error("Jazz.Provider must be used within an Auth Method Provider");
        }

        useEffect(() => {
            const promiseWithDoneCallback = createJazzBrowserContext<Acc>({
                AccountSchema,
                auth,
                peer,
                storage,
            }).then(({ me, done }) => {
                setMe(me);
                return done;
            });

            return () => {
                void promiseWithDoneCallback.then((done) => done());
            };
        }, [AccountSchema, auth, peer, storage]);

        return <JazzContext.Provider value={me}>{children}</JazzContext.Provider>;
    }

    function useAccount(): { me: Acc | undefined };
    function useAccount<D extends DepthsIn<Acc>>(
        depth: D,
    ): { me: DeeplyLoaded<Acc, D> | undefined };
    function useAccount<D extends DepthsIn<Acc>>(
        depth?: D,
    ): { me: Acc | DeeplyLoaded<Acc, D> | undefined } {
        const context = React.useContext(JazzContext);

        const me = useCoState<Acc, D>(
            context?.constructor as CoValueClass<Acc>,
            context?.id,
            depth,
        );

        return {
            me: depth === undefined ? me || context : me,
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
        const me = React.useContext(JazzContext);

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
        const me = React.useContext(JazzContext);
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
        peer: `wss://${string}` | `ws://${string}`;
        storage?: "indexedDB" | "singleTabOPFS";
    }>;

    /** @category Hooks */
    useAccount(): {
        me: Acc | undefined;
    };
    /** @category Hooks */
    useAccount<D extends DepthsIn<Acc>>(
        depth: D,
    ): {
        me: DeeplyLoaded<Acc, D> | undefined;
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
