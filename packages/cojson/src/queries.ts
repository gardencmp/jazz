import { JsonValue } from "./jsonValue.js";
import { CoMap } from "./coValues/coMap.js";
import { CoStream } from "./coValues/coStream.js";
import { CoList } from "./coValues/coList.js";
import { AccountID } from "./account.js";
import { AnyCoList, AnyCoMap, AnyCoStream, CoID, CoValue } from "./coValue.js";
import { LocalNode } from "./localNode.js";
import {
    QueriedAccountAndProfile,
    QueriedCoMap,
    QueriedCoMapBase,
} from "./queriedCoValues/queriedCoMap.js";
import { QueriedCoList } from "./queriedCoValues/queriedCoList.js";
import { QueriedCoStream } from "./queriedCoValues/queriedCoStream.js";

export type Queried<T extends CoValue> = T extends AnyCoMap
    ? QueriedCoMap<T>
    : T extends AnyCoList
    ? QueriedCoList<T>
    : T extends AnyCoStream
    ? T["meta"] extends { type: "binary" }
        ? never
        : QueriedCoStream<T>
    : never;

export type ValueOrSubQueried<
    V extends JsonValue | CoValue | CoID<CoValue> | undefined
> = V extends CoID<infer C>
    ? Queried<C> | undefined
    : V extends CoValue
    ? Queried<V> | undefined
    : V;

export interface CleanupCallbackAndUsable {
    (): void;
    [Symbol.dispose]: () => void;
}

export class QueryContext {
    values: {
        [id: CoID<CoValue>]: {
            lastQueried: Queried<CoValue> | undefined;
            unsubscribe: () => void;
        };
    } = {};
    node: LocalNode;
    onUpdate: () => void;

    constructor(node: LocalNode, onUpdate: () => void) {
        this.node = node;
        this.onUpdate = onUpdate;
    }

    getChildLastQueriedOrSubscribe<T extends CoValue>(valueID: CoID<T>) {
        let value = this.values[valueID];
        if (!value) {
            value = {
                lastQueried: undefined,
                unsubscribe: query(valueID, this.node, (childQueried) => {
                    value!.lastQueried = childQueried as Queried<CoValue>;
                    this.onUpdate();
                }),
            };
            this.values[valueID] = value;
        }
        return value.lastQueried as Queried<T> | undefined;
    }

    resolveAccount(accountID: AccountID) {
        return this.getChildLastQueriedOrSubscribe(
            accountID
        ) as QueriedAccountAndProfile;
    }

    resolveValue<T extends JsonValue>(
        value: T
    ): T extends CoID<infer C> ? Queried<C> | undefined : T {
        return (
            typeof value === "string" && value.startsWith("co_")
                ? this.getChildLastQueriedOrSubscribe(value as CoID<CoValue>)
                : value
        ) as T extends CoID<infer C> ? Queried<C> | undefined : T;
    }

    cleanup() {
        for (const child of Object.values(this.values)) {
            child.unsubscribe();
        }
    }
}

export function query<T extends CoValue>(
    id: CoID<T>,
    node: LocalNode,
    callback: (queried: Queried<T> | undefined) => void,
    parentContext?: QueryContext
): CleanupCallbackAndUsable {
    console.log("querying", id);

    const context = parentContext || new QueryContext(node, onUpdate);

    const unsubscribe = node.subscribe(id, (update) => {
        lastRootValue = update;
        onUpdate();
    });

    let lastRootValue: T | undefined;

    function onUpdate() {
        const rootValue = lastRootValue;

        if (rootValue === undefined) {
            return undefined;
        }

        if (rootValue instanceof CoMap) {
            callback(
                QueriedCoMapBase.newWithKVPairs(
                    rootValue,
                    context
                ) as Queried<T>
            );
        } else if (rootValue instanceof CoList) {
            callback(new QueriedCoList(rootValue, context) as Queried<T>);
        } else if (rootValue instanceof CoStream) {
            if (rootValue.meta?.type === "binary") {
                // Querying binary string not yet implemented
                return {};
            } else {
                callback(new QueriedCoStream(rootValue, context) as Queried<T>);
            }
        }
    }

    const cleanup = function cleanup() {
        context.cleanup();
        unsubscribe();
    } as CleanupCallbackAndUsable;
    cleanup[Symbol.dispose] = cleanup;

    return cleanup;
}
