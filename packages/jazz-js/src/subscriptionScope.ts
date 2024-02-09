import {
    CoValue,
    CoValueBase,
    CoValueSchemaBase,
    ControlledAccount,
    ID,
    subscriptionScopeSym,
} from "./index.js";

export class SubscriptionScope<
    RootSchema extends CoValueSchemaBase = CoValueSchemaBase,
> {
    scopeID: string;
    subscriber: ControlledAccount;
    entries: Map<
        ID<CoValue>,
        | { state: "loading"; immediatelyUnsub?: boolean }
        | { state: "loaded"; value: CoValueBase; rawUnsub: () => void }
    >;
    rootEntry: {
        state: "loaded";
        value: RootSchema["_Value"];
        rawUnsub: () => void;
    };
    reachableFrom: Map<ID<CoValue>, Set<`${ID<CoValue>}/${string}`>> =
        new Map();
    pathToID: Map<`${ID<CoValue>}/${string}`, ID<CoValue>> = new Map();
    onUpdate: (newRoot: RootSchema["_Value"]) => void;

    constructor(
        root: RootSchema["_Value"],
        rootSchema: RootSchema,
        onUpdate: (newRoot: RootSchema["_Value"]) => void
    ) {
        this.scopeID = `scope-${Math.random().toString(36).slice(2)}`;
        this.entries = new Map();
        this.rootEntry = {
            state: "loaded" as const,
            value: root,
            rawUnsub: () => {}, // placeholder
        };
        this.entries.set(root.id, this.rootEntry);
        root[subscriptionScopeSym] = this;
        this.subscriber = root.meta.loadedAs;
        this.onUpdate = onUpdate;
        this.rootEntry.rawUnsub = root.meta.core.subscribe((rawUpdate) => {
            if (!rawUpdate) return;
            this.rootEntry.value = rootSchema.fromRaw(rawUpdate);
            console.log("root update", this.rootEntry.value.toJSON());
            this.rootEntry.value[subscriptionScopeSym] = this;
            onUpdate(this.rootEntry.value);
        });
    }

    onRefAccessedOrSet(
        inId: ID<CoValue>,
        path: string | number,
        accessedOrSetId: ID<CoValue> | undefined,
        schema: CoValueSchemaBase
    ) {
        console.log("onRefAccessedOrSet", inId + "/" + path + " -> " + accessedOrSetId);

        if (!accessedOrSetId) {
            return;
        }

        let reachableFrom = this.reachableFrom.get(accessedOrSetId);
        if (!reachableFrom) {
            reachableFrom = new Set();
            this.reachableFrom.set(accessedOrSetId, reachableFrom);
        }
        const fullPath = `${inId}/${path}` as const;
        console.log("added path", this.scopeID, fullPath + " -> " + accessedOrSetId);
        reachableFrom.add(fullPath);
        this.pathToID.set(fullPath, accessedOrSetId);

        if (!this.entries.has(accessedOrSetId)) {
            const loadingEntry = {
                state: "loading",
                immediatelyUnsub: false,
            } as const;
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
                        const entry = {
                            state: "loaded" as const,
                            value: refValue,
                            rawUnsub: () => {}, // placeholder
                        };
                        this.entries.set(accessedOrSetId, entry);
                        refValue[subscriptionScopeSym] = this;

                        const rawUnsub = refValue.meta.core.subscribe(
                            (rawUpdate) => {
                                if (!rawUpdate) return;
                                if (this.reachableFrom.has(accessedOrSetId)) {
                                    entry.value = schema.fromRaw(rawUpdate);
                                    console.log(
                                        "ref update",
                                        this.scopeID,
                                        fullPath,
                                        entry.value,
                                        accessedOrSetId,
                                        this.reachableFrom
                                    );
                                    entry.value[subscriptionScopeSym] = this;
                                    this.onUpdate(this.rootEntry.value);
                                } else {
                                    console.log("spurious update on old ref");
                                    rawUnsub();
                                }
                            }
                        );

                        entry.rawUnsub = rawUnsub;
                    }
                });
        }
    }

    onRefRemovedOrReplaced(inId: ID<CoValue>, path: string | number) {
        const fullPath = `${inId}/${path}` as const;
        const idAtPath = this.pathToID.get(fullPath);
        const entry = idAtPath && this.entries.get(idAtPath);
        console.log("onRefRemovedOrReplaced", inId + "/" + path + " -> " + idAtPath);

        if (entry) {
            const reachableFrom = this.reachableFrom.get(idAtPath);
            this.pathToID.delete(fullPath);
            reachableFrom?.delete(fullPath);
            console.log("deleted path", this.scopeID, fullPath + " -> " + idAtPath);
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
