import {
    CoValue,
    CoValueBase,
    CoValueSchemaBase,
    ControlledAccount,
    ID,
    subscriptionScopeSym,
} from "./index.js";

export class SubscriptionScope {
    subscriber: ControlledAccount;
    entries: Map<
        ID<CoValue>,
        | { state: "loading"; immediatelyUnsub?: boolean }
        | { state: "loaded"; value: CoValueBase; rawUnsub: () => void }
    >;
    reachableFrom: Map<ID<CoValue>, Set<`${ID<CoValue>}/${string}`>> =
        new Map();
    pathToID: Map<`${ID<CoValue>}/${string}`, ID<CoValue>> = new Map();
    onUpdate: (scope: SubscriptionScope) => void;

    constructor(
        root: CoValueBase,
        onUpdate: (scope: SubscriptionScope) => void
    ) {
        this.entries = new Map();
        const entry = {
            state: "loaded" as const,
            value: root,
            rawUnsub: () => {}, // placeholder
        };
        this.entries.set(root.id, entry);
        root[subscriptionScopeSym] = this;
        this.subscriber = root.meta.loadedAs;
        this.onUpdate = onUpdate;
        entry.rawUnsub = root.meta.core.subscribe(() => {
            console.log("root update");
            onUpdate(this);
        });
    }

    onRefAccessedOrSet(
        inId: ID<CoValue>,
        path: string | number,
        accessedOrSetId: ID<CoValue>,
        schema: CoValueSchemaBase
    ) {
        console.log("onRefAccessedOrSet", inId, path, accessedOrSetId);

        let reachableFrom = this.reachableFrom.get(accessedOrSetId);
        if (!reachableFrom) {
            reachableFrom = new Set();
            this.reachableFrom.set(accessedOrSetId, reachableFrom);
        }
        const fullPath = `${inId}/${path}` as const;
        reachableFrom.add(fullPath);
        this.pathToID.set(fullPath, accessedOrSetId);

        if (!this.entries.has(accessedOrSetId)) {
            const loadingEntry = { state: "loading", immediatelyUnsub: false } as const;
            this.entries.set(accessedOrSetId, loadingEntry);
            void schema
                .load(accessedOrSetId, { as: this.subscriber })
                .then((refValue) => {
                    if (
                        loadingEntry.state === "loading" &&
                        loadingEntry.immediatelyUnsub
                    ) {
                        return;
                    }
                    console.log("ref load", fullPath, refValue?.id);
                    if (refValue) {
                        const rawUnsub = refValue.meta.core.subscribe(() => {
                            console.log("ref update", fullPath);
                            if (this.reachableFrom.has(accessedOrSetId)) {
                                this.onUpdate(this);
                            } else {
                                console.log("spurious update on old ref");
                                rawUnsub();
                            }
                        });
                        this.entries.set(accessedOrSetId, {
                            state: "loaded",
                            value: refValue,
                            rawUnsub,
                        });
                        refValue[subscriptionScopeSym] = this;
                    }
                });
        }
    }

    onRefRemovedOrReplaced(inId: ID<CoValue>, path: string | number) {
        const fullPath = `${inId}/${path}` as const;
        const idAtPath = this.pathToID.get(fullPath);
        const entry = idAtPath && this.entries.get(idAtPath);

        if (entry) {
            const reachableFrom = this.reachableFrom.get(idAtPath);
            this.pathToID.delete(fullPath);
            reachableFrom?.delete(fullPath);
            if ((reachableFrom?.size || 0) === 0) {
                if (entry.state === "loaded") {
                    entry.rawUnsub();
                } else {
                    entry.immediatelyUnsub = true;
                }
                this.entries.delete(idAtPath);
                this.reachableFrom.delete(idAtPath);
                this.pathToID.delete(fullPath);
                // recurse
                for (const path of this.pathToID.keys()) {
                    if (path.includes(idAtPath)) {
                        this.onRefRemovedOrReplaced(
                            idAtPath,
                            path.split("/")[1]!
                        );
                    }
                }
            }
        }
    }

    unsubscribeAll() {
        for (const entry of this.entries.values()) {
            if (entry.state === "loaded") {
                entry.rawUnsub();
                entry.value[subscriptionScopeSym] = undefined;
            } else {
                entry.immediatelyUnsub = true;
            }
        }
        this.entries.clear();
        this.reachableFrom.clear();
        this.pathToID.clear();
    }
}
