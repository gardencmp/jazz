import { CoValue, ControlledAccountValue, ID } from "jazz-schema";

export class AutoSubContext {
    values: {
        [id: ID<CoValue>]: {
            lastValue: CoValue | undefined;
            unsubscribe: () => void;
        };
    } = {};
    account: ControlledAccountValue;
    onUpdate: () => void;

    constructor(account: ControlledAccountValue, onUpdate: () => void) {
        this.account = account;
        this.onUpdate = onUpdate;
    }

    autoSub<T extends CoValue>(valueID: ID<T>) {
        let value = this.values[valueID];
        if (!value) {
            const unsubscribe = this.account.subscribe(
                valueID,
                (value) => {
                    if (value === "unavailable") {
                        // console.warn("Value", valueID, "is unavailable");
                        return;
                    }
                    this.values[valueID]!.lastValue = value;
                    this.onUpdate();
                },
                {
                    onRefAccess: (id) => {
                        this.autoSub(id);
                    },
                }
            );

            value = {
                lastValue: undefined,
                unsubscribe,
            };
            this.values[valueID] = value;
        }
        return value.lastValue as T | undefined;
    }

    cleanup() {
        for (const child of Object.values(this.values)) {
            child.unsubscribe?.();
        }
    }
}

export function autoSub<C extends CoValue>(
    id: ID<C> | undefined,
    { as }: { as: ControlledAccountValue },
    callback: (resolved: C | undefined) => void
): () => void {
    // console.log("querying", id);

    if (!id) return () => {};

    const context = new AutoSubContext(as, () => {
        const rootResolved = context.values[id]?.lastValue;
        callback(rootResolved as C | undefined);
    });

    context.autoSub(id);

    function cleanup() {
        context.cleanup();
    }

    return cleanup;
}

export function autoSubResolution<C extends CoValue, O extends CoValue>(
    id: ID<C> | undefined,
    { as }: { as: ControlledAccountValue },
    drillDown: (root: C) => O | undefined
): Promise<O> {
    return new Promise((resolve) => {
        const cleanUp = autoSub(id, { as }, (root) => {
            if (!root) return;
            const output = drillDown(root);
            if (output) {
                cleanUp();
                resolve(output);
            }
        });
    });
}
