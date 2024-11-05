/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    defineComponent,
    ref,
    provide,
    inject,
    computed,
    watch,
    onMounted,
    Component,
    onUnmounted,
    ComputedRef,
    Ref,
    PropType,
    toRaw,
    shallowRef,
    ShallowRef,
} from "vue";
import {
    createJazzBrowserContext,
    BrowserContext,
    BrowserGuestContext,
    consumeInviteLinkFromWindowLocation,
} from "jazz-browser";
import {
    Account,
    AuthMethod,
    CoValue,
    CoValueClass,
    ID,
    DepthsIn,
    DeeplyLoaded,
    AnonymousJazzAgent,
    subscribeToCoValue,
} from "jazz-tools";

export const logoutHandler = ref<() => void>();

export interface JazzVueApp<Acc extends Account> {
    JazzProvider: Component;

    useAccount(): { me: ComputedRef<Acc>; logOut: () => void };
    useAccount<D extends DepthsIn<Acc>>(
        depth: D,
    ): {
        me: ComputedRef<DeeplyLoaded<Acc, D> | undefined>;
        logOut: () => void;
    };

    useAccountOrGuest(): { me: ComputedRef<Acc | AnonymousJazzAgent> };
    useAccountOrGuest<D extends DepthsIn<Acc>>(
        depth: D,
    ): {
        me: ComputedRef<DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent>;
    };

    useCoState<V extends CoValue, D>(
        Schema: CoValueClass<V>,
        id: ID<V> | undefined,
        depth?: D & DepthsIn<V>,
    ): Ref<DeeplyLoaded<V, D> | undefined>;

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
            const ctx = ref<
                BrowserContext<Acc> | BrowserGuestContext | undefined
            >(undefined);

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
            inject<Ref<BrowserContext<Acc> | BrowserGuestContext>>(
                JazzContextSymbol,
            );
        if (!context) {
            throw new Error(
                "useJazzContext must be used within a JazzProvider",
            );
        }
        return context;
    }

    function useAccount(): { me: ComputedRef<Acc>; logOut: () => void };
    function useAccount<D extends DepthsIn<Acc>>(
        depth: D,
    ): {
        me: ComputedRef<DeeplyLoaded<Acc, D> | undefined>;
        logOut: () => void;
    };
    function useAccount<D extends DepthsIn<Acc>>(
        depth?: D,
    ): {
        me: ComputedRef<Acc | DeeplyLoaded<Acc, D> | undefined>;
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

        const me = useCoState<Acc, D>(
            context.value.me.constructor as CoValueClass<Acc>,
            context.value.me.id,
            depth,
        );

        return {
            me: computed(() => {
                const value =
                    depth === undefined
                        ? me.value ||
                          toRaw((context.value as BrowserContext<Acc>).me)
                        : me.value;

                return value ? toRaw(value) : value;
            }),
            logOut: context.value.logOut,
        };
    }

    function useAccountOrGuest(): { me: ComputedRef<Acc | AnonymousJazzAgent> };
    function useAccountOrGuest<D extends DepthsIn<Acc>>(
        depth: D,
    ): {
        me: ComputedRef<DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent>;
    };
    function useAccountOrGuest<D extends DepthsIn<Acc>>(
        depth?: D,
    ): {
        me: ComputedRef<
            Acc | DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent
        >;
    } {
        const context = useJazzContext();

        if (!context.value) {
            throw new Error(
                "useAccountOrGuest must be used within a JazzProvider",
            );
        }

        const contextMe = "me" in context.value ? context.value.me : undefined;

        const me = useCoState<Acc, D>(
            contextMe?.constructor as CoValueClass<Acc>,
            contextMe?.id,
            depth,
        );

        if ("me" in context.value) {
            return {
                me: computed(() =>
                    depth === undefined
                        ? me.value ||
                          toRaw((context.value as BrowserContext<Acc>).me)
                        : me.value,
                ),
            };
        } else {
            return {
                me: computed(() =>
                    toRaw((context.value as BrowserGuestContext).guest),
                ),
            };
        }
    }

    function useCoState<V extends CoValue, D>(
        Schema: CoValueClass<V>,
        id: ID<V> | undefined,
        depth: D & DepthsIn<V> = [] as D & DepthsIn<V>,
    ): Ref<DeeplyLoaded<V, D> | undefined> {
        const state: ShallowRef<DeeplyLoaded<V, D> | undefined> =
            shallowRef(undefined);
        const context = useJazzContext();

        if (!context.value) {
            throw new Error("useCoState must be used within a JazzProvider");
        }

        let unsubscribe: (() => void) | undefined;

        watch(
            [() => id, () => context, () => Schema, () => depth],
            () => {
                if (unsubscribe) unsubscribe();

                if (!id) return;

                unsubscribe = subscribeToCoValue(
                    Schema,
                    id,
                    "me" in context.value
                        ? toRaw(context.value.me)
                        : toRaw(context.value.guest),
                    depth,
                    (value) => {
                        state.value = value;
                    },
                );
            },
            { immediate: true },
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
            throw new Error(
                "useAcceptInvite must be used within a JazzProvider",
            );
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
