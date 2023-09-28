import { JsonValue } from "./jsonValue.js";
import { CoMap } from "./coValues/coMap.js";
import { CoStream } from "./coValues/coStream.js";
import { CoList } from "./coValues/coList.js";
import { Account, AccountID } from "./coValues/account.js";
import { CoID, CoValue } from "./coValue.js";
import { LocalNode } from "./localNode.js";
import {
    QueriedCoMap,
    QueriedCoMapBase,
} from "./queriedCoValues/queriedCoMap.js";
import { QueriedCoList } from "./queriedCoValues/queriedCoList.js";
import { QueriedCoStream } from "./queriedCoValues/queriedCoStream.js";
import { Group } from "./coValues/group.js";
import { QueriedAccount } from "./queriedCoValues/queriedAccount.js";
import { QueriedGroup } from "./queriedCoValues/queriedGroup.js";

export type Queried<T extends CoValue> = T extends CoMap
    ? T extends Account
        ? QueriedAccount<T>
        : T extends Group
        ? QueriedGroup<T>
        : QueriedCoMap<T>
    : T extends CoList
    ? QueriedCoList<T>
    : T extends CoStream
    ? T["meta"] extends { type: "binary" }
        ? never
        : QueriedCoStream<T>
    :
          | QueriedAccount
          | QueriedGroup
          | QueriedCoMap<CoMap>
          | QueriedCoList<CoList>
          | QueriedCoStream<CoStream>;

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

export interface QueryExtension<T extends CoValue, O> {
    id: string;
    query(
        base: T,
        queryContext: QueryContext,
        onUpdate: (value: O) => void
    ): () => void;
}

export class QueryContext {
    values: {
        [id: CoID<CoValue>]: {
            lastUpdate: CoValue | undefined;
            lastQueried: Queried<CoValue> | undefined;
            render: () => void;
            unsubscribe: () => void;
        };
    } = {};
    extensions: {
        [id: `${CoID<CoValue>}_${string}`]: {
            lastOutput: unknown;
            unsubscribe: () => void;
        };
    } = {};
    node: LocalNode;
    onUpdate: () => void;

    constructor(node: LocalNode, onUpdate: () => void) {
        this.node = node;
        this.onUpdate = onUpdate;
    }

    query<T extends CoValue>(valueID: CoID<T>, alsoRender: CoID<CoValue>[]) {
        let value = this.values[valueID];
        if (!value) {
            const render = () => {
                let newQueried;
                const lastUpdate = value!.lastUpdate;

                if (lastUpdate instanceof CoMap) {
                    if (lastUpdate instanceof Account) {
                        newQueried = new QueriedAccount(
                            lastUpdate,
                            this
                        ) as Queried<T>;
                    } else if (lastUpdate instanceof Group) {
                        newQueried = new QueriedGroup(
                            lastUpdate,
                            this
                        ) as Queried<T>;
                    } else {
                        newQueried = QueriedCoMapBase.newWithKVPairs(
                            lastUpdate,
                            this
                        ) as Queried<T>;
                    }
                } else if (lastUpdate instanceof CoList) {
                    newQueried = new QueriedCoList(
                        lastUpdate,
                        this
                    ) as Queried<T>;
                } else if (lastUpdate instanceof CoStream) {
                    if (lastUpdate.meta?.type === "binary") {
                        // Querying binary string not yet implemented
                    } else {
                        newQueried = new QueriedCoStream(
                            lastUpdate,
                            this
                        ) as Queried<T>;
                    }
                }

                // console.log(
                //     "Rendered ",
                //     valueID,
                //     lastUpdate?.constructor.name,
                //     newQueried
                // );

                value!.lastQueried = newQueried;

                for (const alsoRenderID of alsoRender) {
                    // console.log("Also rendering", alsoRenderID);
                    this.values[alsoRenderID]?.render();
                }
            };

            value = {
                lastQueried: undefined,
                lastUpdate: undefined,
                render,
                unsubscribe: this.node.subscribe(valueID, (valueUpdate) => {
                    value!.lastUpdate = valueUpdate;
                    value!.render();
                    this.onUpdate();
                }),
            };
            this.values[valueID] = value;
        }
        return value.lastQueried as Queried<T> | undefined;
    }

    queryIfCoID<T extends JsonValue | undefined>(value: T, alsoRender: CoID<CoValue>[]): T extends CoID<infer C> ? Queried<C> | undefined : T {
        if (typeof value === "string" && value.startsWith("co_")) {
            return this.query(value as CoID<CoValue>, alsoRender) as T extends CoID<infer C> ? Queried<C> | undefined : never;
        } else {
            return value as T extends CoID<infer C> ? Queried<C> | undefined : T;
        }
    }

    valueOrSubQueryPropertyDescriptor<T extends JsonValue | undefined>(
        value: T,
        alsoRender: CoID<CoValue>[]
    ): T extends CoID<infer C>
        ? { get(): Queried<C> | undefined }
        : { value: T } {
        if (typeof value === "string" && value.startsWith("co_")) {
            // TODO: when we track render dirty status, we can actually return the queried value without a getter if it's up to date
            return {
                get: () => this.query(value as CoID<CoValue>, alsoRender),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { value: value } as any;
        }
    }

    defineSubqueryPropertiesIn<
        O extends object,
        P extends {
            [key: string]: { value: JsonValue | undefined; enumerable: boolean };
        }
    >(
        obj: O,
        subqueryProps: P,
        alsoRender: CoID<CoValue>[]
    ): O & {
        [Key in keyof P]: ValueOrSubQueried<P[Key]["value"]>;
    } {
        for (const [key, descriptor] of Object.entries(subqueryProps)) {
            Object.defineProperty(
                obj,
                key,
                {
                    ...this.valueOrSubQueryPropertyDescriptor(descriptor.value, alsoRender),
                    enumerable: descriptor.enumerable,
                }
            );
        }
        return obj as O & {
            [Key in keyof P]: ValueOrSubQueried<P[Key]["value"]>
        };
    }

    getOrCreateExtension<T extends CoValue, O>(
        valueID: CoID<T>,
        extension: QueryExtension<T, O>
    ): O | undefined {
        const id = `${valueID}_${extension.id}`;
        let ext = this.extensions[id as keyof typeof this.extensions];
        if (!ext) {
            ext = {
                lastOutput: undefined,
                unsubscribe: extension.query(
                    this.node
                        .expectCoValueLoaded(valueID)
                        .getCurrentContent() as T,
                    this,
                    (output) => {
                        ext!.lastOutput = output;
                        this.values[valueID]?.render();
                        this.onUpdate();
                    }
                ),
            };
            this.extensions[id as keyof typeof this.extensions] = ext;
        }
        return ext.lastOutput as O | undefined;
    }

    cleanup() {
        for (const child of Object.values(this.values)) {
            child.unsubscribe?.();
        }
        for (const extension of Object.values(this.extensions)) {
            extension.unsubscribe();
        }
    }
}

export function query<T extends CoValue>(
    id: CoID<T>,
    node: LocalNode,
    callback: (queried: Queried<T> | undefined) => void
): CleanupCallbackAndUsable {
    // console.log("querying", id);

    const context = new QueryContext(node, () => {
        const rootQueried = context.values[id]?.lastQueried as
            | Queried<T>
            | undefined;
        callback(rootQueried);
    });

    context.query(id, []);

    const cleanup = function cleanup() {
        context.cleanup();
    } as CleanupCallbackAndUsable;
    cleanup[Symbol.dispose] = cleanup;

    return cleanup;
}
