import {
  BrowserContext,
  BrowserGuestContext,
  consumeInviteLinkFromWindowLocation,
  createJazzBrowserContext,
} from "jazz-browser";
import {
  Account,
  AnonymousJazzAgent,
  AuthMethod,
  CoValue,
  CoValueClass,
  ID,
  RefsToResolve,
  Resolved,
  subscribeToCoValue,
} from "jazz-tools";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  ComputedRef,
  MaybeRef,
  PropType,
  Ref,
  ShallowRef,
  computed,
  defineComponent,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
  shallowRef,
  toRaw,
  unref,
  watch,
} from "vue";

export const logoutHandler = ref<() => void>();

export interface JazzVueApp<Acc extends Account> {
  JazzProvider: Component;

  useAccount<const O extends { resolve?: RefsToResolve<Acc> }>(
    options?: O,
  ): {
    me: ComputedRef<Resolved<Acc, O> | undefined>;
    logOut: () => void;
  };

  useAccountOrGuest<const O extends { resolve?: RefsToResolve<Acc> }>(
    options?: O,
  ): {
    me: ComputedRef<Resolved<Acc, O> | undefined | AnonymousJazzAgent>;
  };

  useCoState<V extends CoValue, const O extends { resolve?: RefsToResolve<V> }>(
    Schema: CoValueClass<V>,
    id: MaybeRef<ID<V> | undefined>,
    options?: O,
  ): Ref<Resolved<V, O> | undefined>;

  useAcceptInvite<V extends CoValue>(args: {
    invitedObjectSchema: CoValueClass<V>;
    onAccept: (projectID: ID<V>) => void;
    forValueHint?: string;
  }): void;
}

const JazzContextSymbol = Symbol("JazzContext");

export function createJazzVueApp<Acc extends Account>({
  AccountSchema = Account as any,
} = {}): JazzVueApp<Acc> {
  const JazzProvider = defineComponent({
    name: "JazzProvider",
    props: {
      auth: {
        type: [String, Object] as PropType<AuthMethod | "guest">,
        required: true,
      },
      peer: {
        type: String as PropType<`wss://${string}` | `ws://${string}`>,
        required: true,
      },
      storage: {
        type: String as PropType<"indexedDB" | "singleTabOPFS">,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      const ctx = ref<BrowserContext<Acc> | BrowserGuestContext | undefined>(
        undefined,
      );

      const key = ref(0);

      provide(JazzContextSymbol, ctx);

      const initializeContext = async () => {
        if (ctx.value) {
          ctx.value.done?.();
          ctx.value = undefined;
        }

        try {
          const context = await createJazzBrowserContext<Acc>(
            props.auth === "guest"
              ? { peer: props.peer, storage: props.storage }
              : {
                  AccountSchema,
                  auth: props.auth,
                  peer: props.peer,
                  storage: props.storage,
                },
          );

          ctx.value = {
            ...context,
            logOut: () => {
              logoutHandler.value?.();
              // context.logOut();
              key.value += 1;
            },
          };
        } catch (e) {
          console.error("Error creating Jazz browser context:", e);
        }
      };

      onMounted(() => {
        void initializeContext();
      });

      watch(
        () => key.value,
        async () => {
          await initializeContext();
        },
      );

      onUnmounted(() => {
        if (ctx.value) ctx.value.done?.();
      });

      return () => (ctx.value ? slots.default?.() : null);
    },
  });

  function useJazzContext() {
    const context =
      inject<Ref<BrowserContext<Acc> | BrowserGuestContext>>(JazzContextSymbol);
    if (!context) {
      throw new Error("useJazzContext must be used within a JazzProvider");
    }
    return context;
  }

  function useAccount(): {
    me: ComputedRef<Acc>;
    logOut: () => void;
  };
  function useAccount<const O extends { resolve?: RefsToResolve<Acc> }>(
    options?: O,
  ): {
    me: ComputedRef<Resolved<Acc, O> | undefined>;
    logOut: () => void;
  };
  function useAccount<const O extends { resolve?: RefsToResolve<Acc> }>(
    options?: O,
  ): {
    me: ComputedRef<Acc | Resolved<Acc, O> | undefined>;
    logOut: () => void;
  } {
    const context = useJazzContext();

    if (!context.value) {
      throw new Error("useAccount must be used within a JazzProvider");
    }

    if (!("me" in context.value)) {
      throw new Error(
        "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()",
      );
    }

    const contextMe = computed(() =>
      "me" in context.value ? context.value.me : undefined,
    );

    const me = useCoState<Acc, O>(
      contextMe.value?.constructor as CoValueClass<Acc>,
      contextMe.value?.id,
      options,
    );

    return {
      me: computed(() => {
        const value =
          options?.resolve === undefined
            ? me.value ||
              (toRaw((context.value as BrowserContext<Acc>).me) as Resolved<
                Acc,
                O
              >)
            : me.value;

        return value ? toRaw(value) : value;
      }),
      logOut: context.value.logOut,
    };
  }

  function useAccountOrGuest(): {
    me: ComputedRef<Acc | AnonymousJazzAgent>;
  };
  function useAccountOrGuest<const O extends { resolve?: RefsToResolve<Acc> }>(
    options?: O,
  ): {
    me: ComputedRef<Resolved<Acc, O> | undefined | AnonymousJazzAgent>;
  };
  function useAccountOrGuest<const O extends { resolve?: RefsToResolve<Acc> }>(
    options?: O,
  ): {
    me: ComputedRef<Acc | Resolved<Acc, O> | undefined | AnonymousJazzAgent>;
  } {
    const context = useJazzContext();

    if (!context.value) {
      throw new Error("useAccountOrGuest must be used within a JazzProvider");
    }

    const contextMe = computed(() =>
      "me" in context.value ? context.value.me : undefined,
    );

    const me = useCoState<Acc, O>(
      contextMe.value?.constructor as CoValueClass<Acc>,
      contextMe.value?.id,
      options,
    );

    if ("me" in context.value) {
      return {
        me: computed(() =>
          options?.resolve === undefined
            ? me.value ||
              (toRaw((context.value as BrowserContext<Acc>).me) as Resolved<
                Acc,
                O
              >)
            : me.value,
        ),
      };
    } else {
      return {
        me: computed(() => toRaw((context.value as BrowserGuestContext).guest)),
      };
    }
  }

  function useCoState<
    V extends CoValue,
    const O extends { resolve?: RefsToResolve<V> },
  >(
    Schema: CoValueClass<V>,
    id: MaybeRef<ID<V> | undefined>,
    options?: O,
  ): Ref<Resolved<V, O> | undefined> {
    const state: ShallowRef<Resolved<V, O> | undefined> = shallowRef(undefined);
    const context = useJazzContext();

    if (!context.value) {
      throw new Error("useCoState must be used within a JazzProvider");
    }

    let unsubscribe: (() => void) | undefined;

    watch(
      [() => unref(id), () => context, () => Schema, () => options],
      () => {
        if (unsubscribe) unsubscribe();

        const idValue = unref(id);
        if (!idValue) return;

        unsubscribe = subscribeToCoValue(
          Schema,
          idValue,
          "me" in context.value
            ? toRaw(context.value.me)
            : toRaw(context.value.guest),
          options,
          (value) => {
            state.value = value;
          },
        );
      },
      { deep: true, immediate: true },
    );

    onUnmounted(() => {
      if (unsubscribe) unsubscribe();
    });

    const computedState = computed(() => state.value);

    return computedState;
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
    const context = useJazzContext();

    if (!context.value) {
      throw new Error("useAcceptInvite must be used within a JazzProvider");
    }

    if (!("me" in context.value)) {
      throw new Error(
        "useAcceptInvite can't be used in a JazzProvider with auth === 'guest'.",
      );
    }

    const runInviteAcceptance = () => {
      const result = consumeInviteLinkFromWindowLocation({
        as: toRaw((context.value as BrowserContext<Acc>).me),
        invitedObjectSchema,
        forValueHint,
      });

      result
        .then((res) => res && onAccept(res.valueID))
        .catch((e) => {
          console.error("Failed to accept invite", e);
        });
    };

    onMounted(() => {
      runInviteAcceptance();
    });

    watch(
      () => onAccept,
      (newOnAccept, oldOnAccept) => {
        if (newOnAccept !== oldOnAccept) {
          runInviteAcceptance();
        }
      },
    );
  }

  return {
    JazzProvider,
    useAccount,
    useAccountOrGuest,
    useCoState,
    useAcceptInvite,
  };
}
