import {
  BaseBrowserContextOptions,
  BrowserContext,
  BrowserGuestContext,
  consumeInviteLinkFromWindowLocation,
  createJazzBrowserContext,
} from "jazz-browser";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  Inbox,
  InboxSender,
  createCoValueObservable,
} from "jazz-tools";

/** @category Context & Hooks */
export function createJazzReactApp<
  Acc extends Account,
  InboxMessage extends CoValue = CoValue,
>({
  AccountSchema = Account as unknown as AccountClass<Acc>,
  InboxMessageSchema,
}: {
  AccountSchema?: AccountClass<Acc>;
  InboxMessageSchema?: CoValueClass<InboxMessage>;
} = {}): JazzReactApp<Acc, InboxMessage> {
  const JazzContext = React.createContext<
    BrowserContext<Acc> | BrowserGuestContext | undefined
  >(undefined);
  const InboxContext = React.createContext<
    | {
        subscribe: (
          callback: (message: InboxMessage) => Promise<void>,
        ) => () => void;
      }
    | undefined
  >(undefined);

  function Provider({
    children,
    auth,
    peer,
    storage,
  }: {
    children: React.ReactNode;
    auth: AuthMethod | "guest";
    peer: `wss://${string}` | `ws://${string}`;
    storage?: BaseBrowserContextOptions["storage"];
  }) {
    const [ctx, setCtx] = useState<
      BrowserContext<Acc> | BrowserGuestContext | undefined
    >();

    const [sessionCount, setSessionCount] = useState(0);

    const effectExecuted = useRef(false);
    effectExecuted.current = false;

    useEffect(
      () => {
        // Avoid double execution of the effect in development mode for easier debugging.
        if (process.env.NODE_ENV === "development") {
          if (effectExecuted.current) {
            return;
          }
          effectExecuted.current = true;

          // In development mode we don't return a cleanup function because otherwise
          // the double effect execution would mark the context as done immediately.
          //
          // So we mark it as done in the subsequent execution.
          const previousContext = ctx;

          if (previousContext) {
            previousContext.done();
          }
        }

        async function createContext() {
          const currentContext = await createJazzBrowserContext<Acc>(
            auth === "guest"
              ? {
                  peer,
                  storage,
                }
              : {
                  AccountSchema,
                  auth,
                  peer,
                  storage,
                },
          );

          const logOut = () => {
            currentContext.logOut();
            setCtx(undefined);
            setSessionCount(sessionCount + 1);

            if (process.env.NODE_ENV === "development") {
              // In development mode we don't return a cleanup function
              // so we mark the context as done here.
              currentContext.done();
            }
          };

          setCtx({
            ...currentContext,
            logOut,
          });

          return currentContext;
        }

        const promise = createContext();

        // In development mode we don't return a cleanup function because otherwise
        // the double effect execution would mark the context as done immediately.
        if (process.env.NODE_ENV === "development") {
          return;
        }

        return () => {
          void promise.then((context) => context.done());
        };
      },
      [AccountSchema, auth, peer, sessionCount].concat(storage as any),
    );

    return (
      <JazzContext.Provider value={ctx}>
        {ctx && <InboxProvider>{children}</InboxProvider>}
      </JazzContext.Provider>
    );
  }

  function InboxProvider({ children }: { children: React.ReactNode }) {
    const me = useAccount().me;
    const [subscribed, setSubscribed] = useState(false);
    const subscribersRef = useRef(
      new Set<(message: InboxMessage) => Promise<void>>(),
    );

    const handleSubscribe = useCallback(
      (subscriber: (message: InboxMessage) => Promise<void>) => {
        if (!InboxMessageSchema) {
          throw new Error(
            "To subscribe to inbox messages, you must provide an InboxMessageSchema when creating the Jazz context.",
          );
        }

        subscribersRef.current.add(subscriber);
        setSubscribed(true);

        return () => {
          subscribersRef.current.delete(subscriber);
          if (subscribersRef.current.size === 0) {
            setSubscribed(false);
          }
        };
      },
      [],
    );

    useEffect(() => {
      if (!InboxMessageSchema) return;
      if (!subscribed) return;

      let unsubscribe = () => {};
      let unsubscribed = false;

      const load = async () => {
        const inbox = await Inbox.load(me);

        if (unsubscribed) return;

        unsubscribe = inbox.subscribe(
          InboxMessageSchema,
          async (message: InboxMessage) => {
            const promises = [];
            for (const subscriber of subscribersRef.current) {
              promises.push(subscriber(message));
            }
            await Promise.all(promises);
          },
          { retries: 0 },
        );
      };

      load();

      return () => {
        unsubscribed = true;
        unsubscribe();
      };
    }, [subscribed]);

    const context = useMemo(
      () => ({ subscribe: handleSubscribe }),
      [handleSubscribe],
    );

    return (
      <InboxContext.Provider value={context}>{children}</InboxContext.Provider>
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
    const context = React.useContext(JazzContext);

    if (!context) {
      throw new Error("useCoState must be used within a JazzProvider");
    }

    const [observable] = React.useState(() => createCoValueObservable());

    const value = React.useSyncExternalStore<DeeplyLoaded<V, D> | undefined>(
      React.useCallback(
        (callback) => {
          if (!id) return () => {};

          const agent = "me" in context ? context.me : context.guest;

          return observable.subscribe(Schema, id, agent, depth, callback);
        },
        [Schema, id, context],
      ),
      () => observable.getCurrentValue(),
      () => observable.getCurrentValue(),
    );

    return value;
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
      const handleInvite = () => {
        const result = consumeInviteLinkFromWindowLocation({
          as: context.me,
          invitedObjectSchema,
          forValueHint,
        });

        result
          .then((result) => result && onAccept(result?.valueID))
          .catch((e) => {
            console.error("Failed to accept invite", e);
          });
      };

      handleInvite();

      window.addEventListener("hashchange", handleInvite);

      return () => window.removeEventListener("hashchange", handleInvite);
    }, [onAccept]);
  }

  function useInboxSender<I extends CoValue, O extends CoValue | undefined>(
    inboxOwnerID: ID<Acc> | undefined,
  ) {
    const me = useAccount().me;
    const inboxRef = useRef<Promise<InboxSender<I, O>> | undefined>();

    const sendMessage = useCallback(
      async (message: I) => {
        if (!inboxOwnerID) throw new Error("Inbox owner ID is required");

        if (!inboxRef.current) {
          const inbox = InboxSender.load<I, O>(inboxOwnerID, me);
          inboxRef.current = inbox;
        }

        let inbox = await inboxRef.current;

        // @ts-expect-error inbox.owner.id is typed as RawAccount id
        if (inbox.owner.id !== inboxOwnerID) {
          const req = InboxSender.load<I, O>(inboxOwnerID, me);
          inboxRef.current = req;
          inbox = await req;
        }

        return inbox.sendMessage(message);
      },
      [inboxOwnerID],
    );

    return sendMessage;
  }

  function useInboxListener(
    onMessage: (message: InboxMessage) => Promise<void>,
  ) {
    const { subscribe } = useContext(InboxContext)!;

    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    useEffect(() => {
      return subscribe((message) => {
        return onMessageRef.current(message);
      });
    }, []);
  }

  return {
    Provider,
    useAccount,
    useAccountOrGuest,
    useCoState,
    useAcceptInvite,
    experimental: {
      useInboxListener,
      useInboxSender,
    },
  };
}

/** @category Context & Hooks */
export interface JazzReactApp<
  Acc extends Account,
  InboxMessage extends CoValue = CoValue,
> {
  /** @category Provider Component */
  Provider: React.FC<{
    children: React.ReactNode;
    auth: AuthMethod | "guest";
    peer: `wss://${string}` | `ws://${string}`;
    storage?: BaseBrowserContextOptions["storage"];
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

  experimental: {
    useInboxSender<I extends CoValue, O extends CoValue | undefined>(
      inboxOwnerID: ID<Acc> | undefined,
    ): (message: I) => Promise<O extends CoValue ? ID<O> : undefined>;
    useInboxListener(onMessage: (message: InboxMessage) => Promise<void>): void;
  };
}

export { createInviteLink, parseInviteLink } from "jazz-browser";

export * from "./auth/auth.js";
export * from "./media.js";
