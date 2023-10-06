import { JsonObject, JsonValue } from "../jsonValue.js";
import { AgentID, TransactionID } from "../ids.js";
import { CoID, CoValue } from "../coValue.js";
import { isCoValue } from "../typeUtils/isCoValue.js";
import { CoValueCore } from "../coValueCore.js";
import { accountOrAgentIDfromSessionID } from "../typeUtils/accountOrAgentIDfromSessionID.js";
import { AccountID } from "./account.js";
import type { Group } from "./group.js";

type MapOp<K extends string, V extends JsonValue | undefined> = {
    txID: TransactionID;
    madeAt: number;
    changeIdx: number;
} & MapOpPayload<K, V>;
// TODO: add after TransactionID[] for conflicts/ordering

export type MapOpPayload<K extends string, V extends JsonValue | undefined> =
    | {
          op: "set";
          key: K;
          value: V;
      }
    | {
          op: "del";
          key: K;
      };

export class CoMapView<
    Shape extends { [key: string]: JsonValue | undefined } = {
        [key: string]: JsonValue | undefined;
    },
    Meta extends JsonObject | null = JsonObject | null
> implements CoValue
{
    /** @category 6. Meta */
    id: CoID<this>;
    /** @category 6. Meta */
    type = "comap" as const;
    /** @category 6. Meta */
    core: CoValueCore;
    /** @internal */
    ops: {
        [Key in keyof Shape & string]?: MapOp<Key, Shape[Key]>[];
    };
    /** @internal */
    atTimeFilter?: number = undefined;
    /** @category 6. Meta */
    readonly _shape!: Shape;

    /** @internal */
    constructor(
        core: CoValueCore,
        options?: { ignorePrivateTransactions: true }
    ) {
        this.id = core.id as CoID<this>;
        this.core = core;
        this.ops = {};

        for (const { txID, changes, madeAt } of core.getValidSortedTransactions(
            options
        )) {
            for (const [changeIdx, changeUntyped] of changes.entries()) {
                const change = changeUntyped as MapOpPayload<
                    keyof Shape & string,
                    Shape[keyof Shape & string]
                >;
                let entries = this.ops[change.key];
                if (!entries) {
                    entries = [];
                    this.ops[change.key] = entries;
                }
                entries.push({
                    txID,
                    madeAt,
                    changeIdx,
                    ...(change as MapOpPayload<
                        keyof Shape & string,
                        Shape[keyof Shape & string]
                    >),
                });
            }
        }
    }

    /** @category 6. Meta */
    get headerMeta(): Meta {
        return this.core.header.meta as Meta;
    }

    /** @category 6. Meta */
    get group(): Group {
        return this.core.getGroup();
    }

    /** @category 4. Time travel */
    atTime(time: number): this {
        const clone = Object.create(this) as this;
        clone.id = this.id;
        clone.type = this.type;
        clone.core = this.core;
        clone.ops = this.ops;
        clone.atTimeFilter = time;
        return clone;
    }

    /** @internal */
    timeFilteredOps<K extends keyof Shape & string>(
        key: K
    ): MapOp<K, Shape[K]>[] | undefined {
        if (this.atTimeFilter) {
            return this.ops[key]?.filter(
                (op) => op.madeAt <= this.atTimeFilter!
            );
        } else {
            return this.ops[key];
        }
    }

    /**
     * Get all keys currently in the map.
     *
     * @category 1. Reading */
    keys<K extends keyof Shape & string = keyof Shape & string>(): K[] {
        const keys = Object.keys(this.ops) as K[];

        if (this.atTimeFilter) {
            return keys.filter((key) => this.timeFilteredOps(key)?.length);
        } else {
            return keys;
        }
    }

    /**
     * Returns the current value for the given key.
     *
     * @category 1. Reading
     **/
    get<K extends keyof Shape & string>(key: K): Shape[K] | undefined {
        const ops = this.timeFilteredOps(key);
        if (!ops) {
            return undefined;
        }

        const includeUntil = this.atTimeFilter;
        const lastEntry = includeUntil
            ? ops.findLast((entry) => entry.madeAt <= includeUntil)
            : ops[ops.length - 1]!;

        if (lastEntry?.op === "del") {
            return undefined;
        } else {
            return lastEntry?.value;
        }
    }

    /** @category 1. Reading */
    asObject(): {
        [K in keyof Shape & string]: Shape[K];
    } {
        const object: Partial<{
            [K in keyof Shape & string]: Shape[K];
        }> = {};

        for (const key of this.keys()) {
            const value = this.get(key);
            if (value !== undefined) {
                object[key] = value;
            }
        }

        return object as {
            [K in keyof Shape & string]: Shape[K];
        };
    }

    /** @category 1. Reading */
    toJSON(): {
        [K in keyof Shape & string]: Shape[K];
    } {
        return this.asObject();
    }

    /** @category 5. Edit history */
    nthEditAt<K extends keyof Shape & string>(
        key: K,
        n: number
    ):
        | {
              by: AccountID | AgentID;
              tx: TransactionID;
              at: Date;
              value?: Shape[K];
          }
        | undefined {
        const ops = this.timeFilteredOps(key);
        if (!ops || ops.length <= n) {
            return undefined;
        }

        const entry = ops[n]!;

        if (this.atTimeFilter && entry.madeAt > this.atTimeFilter) {
            return undefined;
        }

        return {
            by: accountOrAgentIDfromSessionID(entry.txID.sessionID),
            tx: entry.txID,
            at: new Date(entry.madeAt),
            value: entry.op === "del" ? undefined : entry.value,
        };
    }

    /** @category 5. Edit history */
    lastEditAt<K extends keyof Shape & string>(
        key: K
    ):
        | {
              by: AccountID | AgentID;
              tx: TransactionID;
              at: Date;
              value?: Shape[K];
          }
        | undefined {
        const ops = this.timeFilteredOps(key);
        if (!ops || ops.length === 0) {
            return undefined;
        }
        return this.nthEditAt(key, ops.length - 1);
    }

    /** @category 5. Edit history */
    *editsAt<K extends keyof Shape & string>(key: K) {
        const ops = this.timeFilteredOps(key);
        if (!ops) {
            return;
        }

        for (let i = 0; i < ops.length; i++) {
            yield this.nthEditAt(key, i)!;
        }
    }

    /** @category 3. Subscription */
    subscribe(listener: (coMap: this) => void): () => void {
        return this.core.subscribe((content) => {
            listener(content as this);
        });
    }
}

/** A collaborative map with precise shape `Shape` and optional static metadata `Meta` */
export class CoMap<
        Shape extends { [key: string]: JsonValue | undefined } = {
            [key: string]: JsonValue | undefined;
        },
        Meta extends JsonObject | null = JsonObject | null
    >
    extends CoMapView<Shape, Meta>
    implements CoValue
{
    /** Returns a new version of this CoMap with a new value for the given key.
     *
     * If `privacy` is `"private"` **(default)**, both `key` and `value` are encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, both `key` and `value` are stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     *
     * @category 2. Editing
     **/
    set<K extends keyof Shape & string>(
        key: K,
        value: Shape[K],
        privacy?: "private" | "trusting"
    ): this;
    set(
        kv: {
            [K in keyof Shape & string]?: Shape[K];
        },
        privacy?: "private" | "trusting"
    ): this;
    set<K extends keyof Shape & string>(
        ...args:
            | [
                  {
                      [K in keyof Shape & string]?: Shape[K];
                  },
                  ("private" | "trusting")?
              ]
            | [K, Shape[K], ("private" | "trusting")?]
    ): this {
        if (typeof args[0] === "string") {
            const [key, value, privacy = "private"] = args;
            this.core.makeTransaction(
                [
                    {
                        op: "set",
                        key,
                        value: isCoValue(value) ? value.id : value,
                    },
                ],
                privacy
            );
        } else {
            const [kv, privacy = "private"] = args as [
                {
                    [K in keyof Shape & string]: Shape[K] extends CoValue
                        ? Shape[K] | CoID<Shape[K]>
                        : Shape[K];
                },
                "private" | "trusting" | undefined
            ];

            for (const [key, value] of Object.entries(kv)) {
                this.core.makeTransaction(
                    [
                        {
                            op: "set",
                            key,
                            value: isCoValue(value) ? value.id : value,
                        },
                    ],
                    privacy
                );
            }
        }

        return new CoMap(this.core) as this;
    }

    /** Returns a new version of this CoMap with the given key deleted (setting it to undefined).
     *
     * If `privacy` is `"private"` **(default)**, `key` is encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, `key` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     *
     * @category 2. Editing
     **/
    delete(
        key: keyof Shape & string,
        privacy: "private" | "trusting" = "private"
    ): this {
        this.core.makeTransaction(
            [
                {
                    op: "del",
                    key,
                },
            ],
            privacy
        );

        return new CoMap(this.core) as this;
    }

    /** @category 2. Editing */
    mutate(mutator: (mutable: MutableCoMap<Shape, Meta>) => void): this {
        const mutable = new MutableCoMap<Shape, Meta>(this.core);
        mutator(mutable);
        return new (this.constructor as new (core: CoValueCore) => this)(
            this.core
        );
    }

    /** @deprecated Use `mutate` instead. */
    edit(mutator: (mutable: MutableCoMap<Shape, Meta>) => void): this {
        return this.mutate(mutator);
    }
}

export class MutableCoMap<
        Shape extends { [key: string]: JsonValue | undefined } = {
            [key: string]: JsonValue | undefined;
        },
        Meta extends JsonObject | null = JsonObject | null
    >
    extends CoMapView<Shape, Meta>
    implements CoValue
{
    /** Sets a new value for the given key.
     *
     * If `privacy` is `"private"` **(default)**, both `key` and `value` are encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, both `key` and `value` are stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     *
     * @category 2. Mutation
     */
    set<K extends keyof Shape & string>(
        key: K,
        value: Shape[K],
        privacy: "private" | "trusting" = "private"
    ): void {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const after = (CoMap.prototype.set as Function).call(
            this,
            key,
            value,
            privacy
        ) as CoMap<Shape, Meta>;
        this.ops = after.ops;
    }

    /** Deletes the value for the given key (setting it to undefined).
     *
     * If `privacy` is `"private"` **(default)**, `key` is encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, `key` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     * @category 2. Mutation
     */
    delete(
        key: keyof Shape & string,
        privacy: "private" | "trusting" = "private"
    ): void {
        const after = CoMap.prototype.delete.call(this, key, privacy) as CoMap<
            Shape,
            Meta
        >;
        this.ops = after.ops;
    }
}
