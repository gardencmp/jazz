import {
  type BrowserContext,
  type BrowserGuestContext,
  consumeInviteLinkFromWindowLocation,
} from "jazz-browser";
import type {
  AnonymousJazzAgent,
  CoValue,
  CoValueClass,
  DeeplyLoaded,
  DepthsIn,
  ID,
} from "jazz-tools";
import { Account, createCoValueObservable } from "jazz-tools";
import { getContext, untrack } from "svelte";
import { type MaybeBoxOrGetter, box } from "svelte-toolbelt";

/**
 * The key for the Jazz context.
 */
export const JAZZ_CTX = {};

/**
 * The Jazz context.
 */
export type JazzContext<Acc extends Account> = {
  current?: BrowserContext<Acc> | BrowserGuestContext;
};

/**
 * Get the current Jazz context.
 * @returns The current Jazz context.
 */
export function getJazzContext<Acc extends Account>() {
  return getContext<JazzContext<Acc>>(JAZZ_CTX);
}

/**
 * Create a Jazz app.
 * @returns The Jazz app.
 */
export function createJazzApp<Acc extends Account>() {
  function useAccount(): { me: Acc | undefined; logOut: () => void };
  function useAccount<D extends DepthsIn<Acc>>(
    depth: MaybeBoxOrGetter<D>,
  ): { me: DeeplyLoaded<Acc, D> | undefined; logOut: () => void };
  /**
   * Use the current account with a optional depth.
   * @param depth - The depth.
   * @returns The current account.
   */
  function useAccount<D extends DepthsIn<Acc>>(
    depth?: MaybeBoxOrGetter<D>,
  ): { me: Acc | DeeplyLoaded<Acc, D> | undefined; logOut: () => void } {
    const ctx = getJazzContext<Acc>();
    if (!ctx?.current) {
      throw new Error("useAccount must be used within a JazzProvider");
    }
    if (!("me" in ctx.current)) {
      throw new Error(
        "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()",
      );
    }
    const me = useCoState<Acc, D>(
      ctx.current.me.constructor as CoValueClass<Acc>,
      () => (ctx.current as BrowserContext<Acc>).me?.id,
      depth,
    );
    return {
      get me() {
        if (!ctx.current || !("me" in ctx.current)) return;
        return depth === undefined ? me.current || ctx.current.me : me.current;
      },
      logOut() {
        return ctx.current?.logOut();
      },
    };
  }

  function useAccountOrGuest(): { me: Acc | AnonymousJazzAgent };
  function useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth: MaybeBoxOrGetter<D>,
  ): { me: DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent };
  /**
   * Use the current account or guest with a optional depth.
   * @param depth - The depth.
   * @returns The current account or guest.
   */
  function useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth?: MaybeBoxOrGetter<D>,
  ): { me: Acc | DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent } {
    const ctx = getJazzContext<Acc>();

    if (!ctx?.current) {
      throw new Error("useAccountOrGuest must be used within a JazzProvider");
    }

    const contextMe = "me" in ctx.current ? ctx.current.me : undefined;

    const me = useCoState<Acc, D>(
      contextMe?.constructor as CoValueClass<Acc>,
      contextMe?.id,
      depth,
    );

    // If the context has a me, return the account.
    if ("me" in ctx.current) {
      return {
        get me() {
          return depth === undefined
            ? me.current || (ctx.current as BrowserContext<Acc>)?.me
            : me.current;
        },
      };
    }
    // If the context has no me, return the guest.
    else {
      return {
        get me() {
          return (ctx.current as BrowserGuestContext)?.guest;
        },
      };
    }
  }

  /**
   * Use a CoValue with a optional depth.
   * @param Schema - The CoValue schema.
   * @param id - The CoValue id.
   * @param depth - The depth.
   * @returns The CoValue.
   */
  function useCoState<V extends CoValue, D>(
    Schema: CoValueClass<V>,
    id: MaybeBoxOrGetter<ID<V>> | undefined,
    depth: MaybeBoxOrGetter<D & DepthsIn<V>> = [] as D & DepthsIn<V>,
  ): {
    current?: DeeplyLoaded<V, D>;
  } {
    const ctx = getJazzContext<Acc>();
    const _id = box.from(id);
    const _depth = box.from(depth);
    
    // Create state and a stable observable
    let state = $state.raw<DeeplyLoaded<V, D> | undefined>(undefined);
    const observable = $state.raw(createCoValueObservable());

    // Effect to handle subscription
    $effect(() => {
      // Reset state when dependencies change
      state = undefined;

      // Get latest values
      const currentCtx = ctx.current;
      const currentId = _id.current;
      const currentDepth = _depth.current;

      // Return early if no context or id, effectively cleaning up any previous subscription
      if (!currentCtx || !currentId) return;

      // Setup subscription with current values
      return observable.subscribe(
        Schema,
        currentId,
        "me" in currentCtx ? currentCtx.me : currentCtx.guest,
        currentDepth,
        () => {
          // Get current value from our stable observable
          state = observable.getCurrentValue();
        },
      );
    });

    return {
      get current() {
        return state;
      },
    };
  }

  /**
   * Use the accept invite hook.
   * @param invitedObjectSchema - The invited object schema.
   * @param onAccept - Function to call when the invite is accepted.
   * @param forValueHint - Hint for the value.
   * @returns The accept invite hook.
   */
  function useAcceptInvite<V extends CoValue>({
    invitedObjectSchema,
    onAccept,
    forValueHint,
  }: {
    invitedObjectSchema: CoValueClass<V>;
    onAccept: MaybeBoxOrGetter<(projectID: ID<V>) => void>;
    forValueHint?: string;
  }): void {
    const ctx = getJazzContext<Acc>();
    const _onAccept = box.from(onAccept);

    if (!ctx.current) {
      throw new Error("useAcceptInvite must be used within a JazzProvider");
    }

    if (!("me" in ctx.current)) {
      throw new Error(
        "useAcceptInvite can't be used in a JazzProvider with auth === 'guest'.",
      );
    }

    // Subscribe to the onAccept function.
    $effect(() => {
      _onAccept.current;
      // Subscribe to the onAccept function.
      untrack(() => {
        // If there is no context, return.
        if (!ctx.current) return;
        // Consume the invite link from the window location.
        const result = consumeInviteLinkFromWindowLocation({
          as: (ctx.current as BrowserContext<Acc>).me,
          invitedObjectSchema,
          forValueHint,
        });
        // If the result is valid, call the onAccept function.
        result
          .then((result) => result && _onAccept.current?.(result?.valueID))
          .catch((e) => {
            console.error("Failed to accept invite", e);
          });
      });
    });
  }

  return {
    useAccount,
    useAccountOrGuest,
    useCoState,
    useAcceptInvite,
  };
}
