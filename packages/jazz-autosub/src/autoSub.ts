import {
    Account,
    CoID,
    CoList,
    CoMap,
    CoStream,
    CoValue,
    Group,
    JsonValue,
    LocalNode,
    cojsonInternals,
} from "cojson";
import {
    ResolvedCoMap,
    ResolvedCoMapBase,
} from "./resolvedCoValues/resolvedCoMap.js";
import { ResolvedCoList } from "./resolvedCoValues/resolvedCoList.js";
import { ResolvedCoStream } from "./resolvedCoValues/resolvedCoStream.js";
import { ResolvedAccount } from "./resolvedCoValues/resolvedAccount.js";
import { ResolvedGroup } from "./resolvedCoValues/resolvedGroup.js";

export type Resolved<T extends CoValue> = T extends CoMap
    ? T extends Account
        ? ResolvedAccount<T>
        : T extends Group
        ? ResolvedGroup<T>
        : ResolvedCoMap<T>
    : T extends CoList
    ? ResolvedCoList<T>
    : T extends CoStream
    ? T["headerMeta"] extends { type: "binary" }
        ? never
        : ResolvedCoStream<T>
    :
          | ResolvedAccount
          | ResolvedGroup
          | ResolvedCoMap<CoMap>
          | ResolvedCoList<CoList>
          | ResolvedCoStream<CoStream>;

export type ValueOrResolvedRef<
    V extends JsonValue | CoValue | CoID<CoValue> | undefined
> = V extends CoID<infer C>
    ? Resolved<C> | undefined
    : V extends CoValue
    ? Resolved<V> | undefined
    : V;

export interface AutoSubExtension<T extends CoValue, O> {
    id: string;
    subscribe(
        base: T,
        autoSubContext: AutoSubContext,
        onUpdate: (value: O) => void
    ): () => void;
}

export class AutoSubContext {
    values: {
        [id: CoID<CoValue>]: {
            lastUpdate: CoValue | undefined;
            lastLoaded: Resolved<CoValue> | undefined;
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

    autoSub<T extends CoValue>(valueID: CoID<T>, alsoRender: CoID<CoValue>[], _path: string) {
        let value = this.values[valueID];
        if (!value) {
            // console.log("Auto-sub to", valueID, "from", path)
            const render = () => {
                let newLoaded;
                const lastUpdate = value!.lastUpdate;

                if (lastUpdate instanceof CoMap) {
                    if (lastUpdate instanceof Account) {
                        newLoaded = new ResolvedAccount(
                            lastUpdate,
                            this
                        ) as Resolved<T>;
                    } else if (lastUpdate instanceof Group) {
                        newLoaded = new ResolvedGroup(
                            lastUpdate,
                            this
                        ) as Resolved<T>;
                    } else {
                        newLoaded = ResolvedCoMapBase.newWithKVPairs(
                            lastUpdate,
                            this
                        ) as Resolved<T>;
                    }
                } else if (lastUpdate instanceof CoList) {
                    newLoaded = new ResolvedCoList(
                        lastUpdate,
                        this
                    ) as Resolved<T>;
                } else if (lastUpdate instanceof CoStream) {
                    if (lastUpdate.headerMeta?.type === "binary") {
                        // Querying binary string not yet implemented
                    } else {
                        newLoaded = new ResolvedCoStream(
                            lastUpdate,
                            this
                        ) as Resolved<T>;
                    }
                }

                // console.log(
                //     "Rendered ",
                //     valueID,
                //     lastUpdate?.constructor.name,
                //     newResolved
                // );

                value!.lastLoaded = newLoaded;

                for (const alsoRenderID of alsoRender) {
                    // console.log("Also rendering", alsoRenderID);
                    this.values[alsoRenderID]?.render();
                }
            };

            value = {
                lastLoaded: undefined,
                lastUpdate: undefined,
                render,
                unsubscribe: this.node.subscribe(valueID, (valueUpdate) => {
                    if (valueUpdate === "unavailable") {
                        // console.warn("Value", valueID, "is unavailable");
                        return;
                    }
                    value!.lastUpdate = valueUpdate;
                    value!.render();
                    this.onUpdate();
                }),
            };
            this.values[valueID] = value;
        }
        return value.lastLoaded as Resolved<T> | undefined;
    }

    subscribeIfCoID<T extends JsonValue | undefined>(
        value: T,
        alsoRender: CoID<CoValue>[],
        path: string
    ): T extends CoID<infer C> ? Resolved<C> | undefined : T {
        if (typeof value === "string" && value.startsWith("co_")) {
            return this.autoSub(
                value as CoID<CoValue>,
                alsoRender,
                path
            ) as T extends CoID<infer C> ? Resolved<C> | undefined : never;
        } else {
            return value as T extends CoID<infer C>
                ? Resolved<C> | undefined
                : T;
        }
    }

    valueOrResolvedRefPropertyDescriptor<T extends JsonValue | undefined>(
        value: T,
        alsoRender: CoID<CoValue>[],
        path: string
    ): T extends CoID<infer C>
        ? { get(): Resolved<C> | undefined }
        : { value: T } {
        if (typeof value === "string" && value.startsWith("co_")) {
            // TODO: when we track render dirty status, we can actually return the resolved value without a getter if it's up to date
            return {
                get: () => this.autoSub(value as CoID<CoValue>, alsoRender, path),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { value: value } as any;
        }
    }

    defineResolvedRefPropertiesIn<
        O extends object,
        P extends {
            [key: string]: {
                value: JsonValue | undefined;
                enumerable: boolean;
            };
        }
    >(
        obj: O,
        subqueryProps: P,
        alsoRender: CoID<CoValue>[]
    ): O & {
        [Key in keyof P]: ValueOrResolvedRef<P[Key]["value"]>;
    } {
        for (const [key, descriptor] of Object.entries(subqueryProps)) {
            Object.defineProperty(obj, key, {
                ...this.valueOrResolvedRefPropertyDescriptor(
                    descriptor.value,
                    alsoRender,
                    key
                ),
                enumerable: descriptor.enumerable,
            });
        }
        return obj as O & {
            [Key in keyof P]: ValueOrResolvedRef<P[Key]["value"]>;
        };
    }

    getOrCreateExtension<T extends CoValue, O>(
        valueID: CoID<T>,
        extension: AutoSubExtension<T, O>
    ): O | undefined {
        const id = `${valueID}_${extension.id}`;
        let ext = this.extensions[id as keyof typeof this.extensions];
        if (!ext) {
            ext = {
                lastOutput: undefined,
                unsubscribe: extension.subscribe(
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

export function autoSub<C extends CoValue>(
    id: CoID<C> | undefined,
    node: LocalNode,
    callback: (resolved: Resolved<C> | undefined) => void
): () => void;
export function autoSub<A extends Account = Account>(
    id: "me",
    node: LocalNode,
    callback: (resolved: ResolvedAccount<A> | undefined) => void
): () => void;
export function autoSub(
    id: CoID<CoValue> | "me" | undefined,
    node: LocalNode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (resolved: any | undefined) => void
): () => void;
export function autoSub(
    id: CoID<CoValue> | "me" | undefined,
    node: LocalNode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (resolved: any | undefined) => void
): () => void {
    // console.log("querying", id);
    const effectiveId =
        id === "me"
            ? cojsonInternals.isAccountID(node.account.id)
                ? node.account.id
                : undefined
            : id;

    if (!effectiveId) return () => {};

    // const ctxId = Math.random().toString(16).slice(2);
    // let updateN = 0;

    const context = new AutoSubContext(node, () => {
        const rootResolved = context.values[effectiveId]?.lastLoaded;
        // const n = updateN;
        // updateN++;
        // console.time("AutoSubContext.onUpdate " + n + " " + ctxId);
        callback(rootResolved);
        // console.timeEnd("AutoSubContext.onUpdate " + n + " " + ctxId);
    });

    context.autoSub(effectiveId, [], "");

    function cleanup() {
        context.cleanup();
    }

    return cleanup;
}

export function autoSubResolution<
    A extends Account,
    O extends Resolved<CoValue>
>(
    id: "me",
    drillDown: (root: ResolvedAccount<A>) => O | undefined,
    node: LocalNode
): Promise<O>;
export function autoSubResolution<
    C extends CoValue,
    O extends Resolved<CoValue>
>(
    id: CoID<C> | undefined,
    drillDown: (root: Resolved<C>) => O | undefined,
    node: LocalNode
): Promise<O>;
export function autoSubResolution(
    id: CoID<CoValue> | undefined | "me",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    drillDown: (root: any) => any,
    node: LocalNode
): Promise<Resolved<CoValue> | undefined>;
export function autoSubResolution(
    id: CoID<CoValue> | undefined | "me",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    drillDown: (root: any) => any,
    node: LocalNode
): Promise<Resolved<CoValue> | undefined> {
    return new Promise((resolve) => {
        const cleanUp = autoSub(id, node, (root) => {
            if (!root) return;
            const output = drillDown(root);
            if (output) {
                cleanUp();
                resolve(output);
            }
        });
    });
}
