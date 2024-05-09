import type { RawCoValue } from "cojson";
import type { Account, CoValue, CoValueBase, ID, Me, ClassOf } from "../internal.js";

export const subscriptionsScopes = new WeakMap<
    CoValue,
    SubscriptionScope<any>
>();

export class SubscriptionScope<
    Root extends CoValue
> {
    scopeID: string = `scope-${Math.random().toString(36).slice(2)}`;
    subscriber: Account & Me;
    entries = new Map<
        ID<CoValue>,
        | { state: "loading"; immediatelyUnsub?: boolean }
        | { state: "loaded"; rawUnsub: () => void }
    >();
    rootEntry: {
        state: "loaded";
        value: Root;
        rawUnsub: () => void;
    };
    onUpdate: (newRoot: Root) => void;
    scheduledUpdate: boolean = false;

    constructor(
        root: Root,
        rootSchema: ClassOf<Root> & typeof CoValueBase,
        onUpdate: (newRoot: Root) => void
    ) {
        this.rootEntry = {
            state: "loaded" as const,
            value: root,
            rawUnsub: () => {}, // placeholder
        };
        this.entries.set(root.id, this.rootEntry);

        subscriptionsScopes.set(root, this);

        this.subscriber = root._loadedAs;
        this.onUpdate = onUpdate;
        this.rootEntry.rawUnsub = root._raw.core.subscribe(
            (rawUpdate: RawCoValue | undefined) => {
                if (!rawUpdate) return;
                this.rootEntry.value = rootSchema.fromRaw(
                    rawUpdate
                ) as Root;
                // console.log("root update", this.rootEntry.value.toJSON());
                subscriptionsScopes.set(this.rootEntry.value, this);
                this.scheduleUpdate();
            }
        );
    }

    scheduleUpdate() {
        if (!this.scheduledUpdate) {
            this.scheduledUpdate = true;
            queueMicrotask(() => {
                this.scheduledUpdate = false;
                this.onUpdate(this.rootEntry.value);
            });
        }
    }

    onRefAccessedOrSet(accessedOrSetId: ID<CoValue> | undefined) {
        // console.log("onRefAccessedOrSet", this.scopeID, accessedOrSetId);
        if (!accessedOrSetId) {
            return;
        }

        if (!this.entries.has(accessedOrSetId)) {
            const loadingEntry = {
                state: "loading",
                immediatelyUnsub: false,
            } as const;
            this.entries.set(accessedOrSetId, loadingEntry);
            void this.subscriber._raw.core.node
                .loadCoValueCore(accessedOrSetId)
                .then((core) => {
                    if (
                        loadingEntry.state === "loading" &&
                        loadingEntry.immediatelyUnsub
                    ) {
                        return;
                    }
                    if (core !== "unavailable") {
                        const entry = {
                            state: "loaded" as const,
                            rawUnsub: () => {}, // placeholder
                        };
                        this.entries.set(accessedOrSetId, entry);

                        const rawUnsub = core.subscribe((rawUpdate) => {
                            // console.log("ref update", this.scopeID, accessedOrSetId, JSON.stringify(rawUpdate))
                            if (!rawUpdate) return;
                            this.scheduleUpdate();
                        });

                        entry.rawUnsub = rawUnsub;
                    }
                });
        }
    }

    unsubscribeAll() {
        for (const entry of this.entries.values()) {
            if (entry.state === "loaded") {
                entry.rawUnsub();
            } else {
                entry.immediatelyUnsub = true;
            }
        }
        this.entries.clear();
    }
}
