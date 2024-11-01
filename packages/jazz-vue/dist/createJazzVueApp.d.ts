import { Account, AnonymousJazzAgent, CoValue, CoValueClass, DeeplyLoaded, DepthsIn, ID } from 'jazz-tools';
import { Component, ComputedRef, Ref } from 'vue';
export declare const logoutHandler: Ref<(() => void) | undefined, (() => void) | undefined>;
export interface JazzVueApp<Acc extends Account> {
    JazzProvider: Component;
    useAccount(): {
        me: ComputedRef<Acc>;
        logOut: () => void;
    };
    useAccount<D extends DepthsIn<Acc>>(depth: D): {
        me: ComputedRef<DeeplyLoaded<Acc, D> | undefined>;
        logOut: () => void;
    };
    useAccountOrGuest(): {
        me: ComputedRef<Acc | AnonymousJazzAgent>;
    };
    useAccountOrGuest<D extends DepthsIn<Acc>>(depth: D): {
        me: ComputedRef<DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent>;
    };
    useCoState<V extends CoValue, D>(Schema: CoValueClass<V>, id: ID<V> | undefined, depth?: D & DepthsIn<V>): Ref<DeeplyLoaded<V, D> | undefined>;
    useAcceptInvite<V extends CoValue>(args: {
        invitedObjectSchema: CoValueClass<V>;
        onAccept: (projectID: ID<V>) => void;
        forValueHint?: string;
    }): void;
}
export declare function createJazzVueApp<Acc extends Account>({ AccountSchema, }?: {
    AccountSchema?: any;
}): JazzVueApp<Acc>;
