import {
  type BrowserContext,
  type BrowserGuestContext,
  consumeInviteLinkFromWindowLocation
} from 'jazz-browser';
import type {
  AccountClass,
  AnonymousJazzAgent,
  CoValue,
  CoValueClass,
  ID,
  RefsToResolve,
  Resolved
} from 'jazz-tools';
import { Account, createCoValueObservable } from 'jazz-tools';
import { getContext, untrack, type Component } from 'svelte';
import type { Props } from './Provider.svelte';
import Provider from './Provider.svelte';

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
export function createJazzApp<Acc extends Account = Account>({
  AccountSchema = Account as unknown as AccountClass<Acc>
}: {
  AccountSchema?: AccountClass<Acc>;
} = {}) {
  type PropsWithoutSchema<Acc extends Account = Account> = Omit<Props<Acc>, 'schema'>;

  // Create a provider component with the schema baked in
  const ProviderWithSchema: Component<PropsWithoutSchema<Acc>> = (internal, props) => {
    return Provider(internal, {
      ...props,
      schema: AccountSchema
    });
  };

  function useAccount<const O extends { resolve?: RefsToResolve<Acc> }>(
    options?: O
  ): { me: Resolved<Acc, O> | undefined; logOut: () => void };
  /**
   * Use the current account with a optional depth.
   * @param depth - The depth.
   * @returns The current account.
   */
  function useAccount<const O extends { resolve?: RefsToResolve<Acc> }>(
    options?: O
  ): { me: Resolved<Acc, O> | undefined; logOut: () => void } {
    const ctx = getJazzContext<Acc>();
    if (!ctx?.current) {
      throw new Error('useAccount must be used within a JazzProvider');
    }
    if (!('me' in ctx.current)) {
      throw new Error(
        "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()"
      );
    }

    // If no depth is specified, return the context's me directly
    if (options?.resolve === undefined) {
      return {
        get me() {
          return (ctx.current as BrowserContext<Acc>).me as Resolved<Acc, O>;
        },
        logOut() {
          return ctx.current?.logOut();
        }
      };
    }

    // If depth is specified, use useCoState to get the deeply loaded version
    const me = useCoState<Acc, O>(
      ctx.current.me.constructor as CoValueClass<Acc>,
      (ctx.current as BrowserContext<Acc>).me.id,
      options
    );

    return {
      get me() {
        return me.current;
      },
      logOut() {
        return ctx.current?.logOut();
      }
    };
  }

  function useAccountOrGuest(
  ): { me: Acc | AnonymousJazzAgent };
  function useAccountOrGuest<const O extends { resolve?: RefsToResolve<Acc> }>(
    options?: O
  ): { me: Resolved<Acc, O> | undefined | AnonymousJazzAgent };
  /**
   * Use the current account or guest with a optional depth.
   * @param depth - The depth.
   * @returns The current account or guest.
   */
  function useAccountOrGuest<const O extends { resolve?: RefsToResolve<Acc> }>(
    options?: O
  ): { me: Acc | Resolved<Acc, O> | undefined | AnonymousJazzAgent } {
    const ctx = getJazzContext<Acc>();

    if (!ctx?.current) {
      throw new Error('useAccountOrGuest must be used within a JazzProvider');
    }

    const contextMe = 'me' in ctx.current ? ctx.current.me : undefined;

    const me = useCoState<Acc, O>(
      contextMe?.constructor as CoValueClass<Acc>,
      contextMe?.id,
      options
    );

    // If the context has a me, return the account.
    if ('me' in ctx.current) {
      return {
        get me() {
          return options?.resolve === undefined
            ? me.current || (ctx.current as BrowserContext<Acc>)?.me as Resolved<Acc, O>
            : me.current;
        }
      };
    }
    // If the context has no me, return the guest.
    else {
      return {
        get me() {
          return (ctx.current as BrowserGuestContext)?.guest;
        }
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
  function useCoState<V extends CoValue, const O extends { resolve?: RefsToResolve<V> }>(
    Schema: CoValueClass<V>,
    id: ID<V> | undefined,
    options?: O
  ): {
    current?: Resolved<V, O>;
  } {
    const ctx = getJazzContext<Acc>();

    // Create state and a stable observable
    let state = $state.raw<Resolved<V, O> | undefined>(undefined);
    const observable = $state.raw(createCoValueObservable(Schema, options));

    // Effect to handle subscription
    // TODO: Possibly memoise this, to avoid re-subscribing
    $effect(() => {
      // Reset state when dependencies change
      state = undefined;

      // Return early if no context or id, effectively cleaning up any previous subscription
      if (!ctx?.current || !id) return;

      // Setup subscription with current values
      return observable.subscribe(
        id,
        'me' in ctx.current ? ctx.current.me : ctx.current.guest,
        () => {
          // Get current value from our stable observable
          state = observable.getCurrentValue();
        }
      );
    });

    return {
      get current() {
        return state;
      }
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
    forValueHint
  }: {
    invitedObjectSchema: CoValueClass<V>;
    onAccept: (projectID: ID<V>) => void;
    forValueHint?: string;
  }): void {
    const ctx = getJazzContext<Acc>();
    const _onAccept = onAccept;

    if (!ctx.current) {
      throw new Error('useAcceptInvite must be used within a JazzProvider');
    }

    if (!('me' in ctx.current)) {
      throw new Error("useAcceptInvite can't be used in a JazzProvider with auth === 'guest'.");
    }

    // Subscribe to the onAccept function.
    $effect(() => {
      _onAccept;
      // Subscribe to the onAccept function.
      untrack(() => {
        // If there is no context, return.
        if (!ctx.current) return;
        // Consume the invite link from the window location.
        const result = consumeInviteLinkFromWindowLocation({
          as: (ctx.current as BrowserContext<Acc>).me,
          invitedObjectSchema,
          forValueHint
        });
        // If the result is valid, call the onAccept function.
        result
          .then((result) => result && _onAccept(result?.valueID))
          .catch((e) => {
            console.error('Failed to accept invite', e);
          });
      });
    });
  }

  return {
    Provider: ProviderWithSchema,
    useAccount,
    useAccountOrGuest,
    useCoState,
    useAcceptInvite
  };
}
