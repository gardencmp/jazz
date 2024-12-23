import React, { useEffect, useState } from "react";

import {
  Account,
  AccountClass,
  AnonymousJazzAgent,
  AuthMethod,
  CoValue,
  CoValueClass,
  DeeplyLoaded,
  DepthsIn,
  ID,
  subscribeToCoValue,
} from "jazz-tools";
import { Linking } from "react-native";
import {
  BaseReactNativeContextOptions,
  KvStore,
  KvStoreContext,
  ReactNativeContext,
  ReactNativeGuestContext,
  createJazzRNContext,
  parseInviteLink,
} from "./index.js";
import { ExpoSecureStoreAdapter } from "./storage/expo-secure-store-adapter.js";

/** @category Context & Hooks */
export function createJazzRNApp<Acc extends Account>({
  kvStore = new ExpoSecureStoreAdapter(),
  AccountSchema = Account as unknown as AccountClass<Acc>,
  CryptoProvider,
}: {
  kvStore?: KvStore;
  AccountSchema?: AccountClass<Acc>;
  CryptoProvider?: BaseReactNativeContextOptions["CryptoProvider"];
} = {}): JazzReactApp<Acc> {
  const JazzContext = React.createContext<
    ReactNativeContext<Acc> | ReactNativeGuestContext | undefined
  >(undefined);

  if (!kvStore) {
    throw new Error("kvStore is required");
  }

  KvStoreContext.getInstance().initialize(kvStore);

  function Provider({
    children,
    auth,
    peer,
    storage,
  }: {
    children: React.ReactNode;
    auth: AuthMethod | "guest";
    peer: `wss://${string}` | `ws://${string}`;
    storage?: "indexedDB" | "singleTabOPFS";
  }) {
    const [ctx, setCtx] = useState<
      ReactNativeContext<Acc> | ReactNativeGuestContext | undefined
    >();

    const [sessionCount, setSessionCount] = useState(0);

    useEffect(() => {
      const promiseWithDoneCallback = createJazzRNContext<Acc>(
        auth === "guest"
          ? {
              peer,
              storage,
              CryptoProvider,
            }
          : {
              AccountSchema,
              auth: auth,
              peer,
              storage,
              CryptoProvider,
            },
      ).then((context) => {
        setCtx({
          ...context,
          logOut: () => {
            context.logOut();
            setCtx(undefined);
            setSessionCount(sessionCount + 1);
          },
        });
        return context.done;
      });

      return () => {
        void promiseWithDoneCallback
          .then((done) => done())
          .catch((e) => {
            console.error("Error in createJazzRNContext", e);
          });
      };
    }, [AccountSchema, auth, peer, storage, sessionCount]);

    return (
      <JazzContext.Provider value={ctx}>{ctx && children}</JazzContext.Provider>
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

    if (!("me" in context)) {
      throw new Error(
        "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()",
      );
    }

    const me = useCoState<Acc, D>(
      context?.me.constructor as CoValueClass<Acc>,
      context?.me.id,
      depth,
    );

    return {
      me: depth === undefined ? me || context.me : me,
      logOut: context.logOut,
    };
  }

  function useAccountOrGuest(): { me: Acc | AnonymousJazzAgent };
  function useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth: D,
  ): { me: DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent };
  function useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth?: D,
  ): { me: Acc | DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent } {
    const context = React.useContext(JazzContext);

    if (!context) {
      throw new Error("useAccountOrGuest must be used within a JazzProvider");
    }

    const contextMe = "me" in context ? context.me : undefined;

    const me = useCoState<Acc, D>(
      contextMe?.constructor as CoValueClass<Acc>,
      contextMe?.id,
      depth,
    );

    if ("me" in context) {
      return {
        me: depth === undefined ? me || context.me : me,
      };
    } else {
      return { me: context.guest };
    }
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
    const context = React.useContext(JazzContext);

    if (!context) {
      throw new Error("useCoState must be used within a JazzProvider");
    }

    useEffect(() => {
      if (!id) return;

      return subscribeToCoValue(
        Schema,
        id,
        "me" in context ? context.me : context.guest,
        depth,
        (value) => {
          setState({ value });
        },
      );
    }, [Schema, id, context]);

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
    const context = React.useContext(JazzContext);

    if (!context) {
      throw new Error("useAcceptInvite must be used within a JazzProvider");
    }

    if (!("me" in context)) {
      throw new Error(
        "useAcceptInvite can't be used in a JazzProvider with auth === 'guest'.",
      );
    }

    useEffect(() => {
      const handleDeepLink = ({ url }: { url: string }) => {
        const result = parseInviteLink<V>(url);
        if (result && result.valueHint === forValueHint) {
          context.me
            .acceptInvite(
              result.valueID,
              result.inviteSecret,
              invitedObjectSchema,
            )
            .then(() => {
              onAccept(result.valueID);
            })
            .catch((e) => {
              console.error("Failed to accept invite", e);
            });
        }
      };

      const linkingListener = Linking.addEventListener("url", handleDeepLink);

      void Linking.getInitialURL().then((url) => {
        if (url) handleDeepLink({ url });
      });

      return () => {
        linkingListener.remove();
      };
    }, [context, onAccept, invitedObjectSchema, forValueHint]);
  }

  return {
    Provider,
    useAccount,
    useAccountOrGuest,
    useCoState,
    useAcceptInvite,
    kvStore,
  };
}

/** @category Context & Hooks */
export interface JazzReactApp<Acc extends Account> {
  /** @category Provider Component */
  Provider: React.FC<{
    children: React.ReactNode;
    auth: AuthMethod | "guest";
    peer: `wss://${string}` | `ws://${string}`;
    storage?: "indexedDB" | "singleTabOPFS";
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
  useAccountOrGuest(): {
    me: Acc | AnonymousJazzAgent;
  };
  useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth: D,
  ): {
    me: DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent;
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

  kvStore: KvStore;
}

export * from "./media.js";
