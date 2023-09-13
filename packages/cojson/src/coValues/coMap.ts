import { JsonObject, JsonValue } from "../jsonValue.js";
import { TransactionID } from "../ids.js";
import {
    CoID,
    CoValueImpl,
    ReadableCoValue,
    WriteableCoValue,
    isCoValueImpl,
} from "../coValue.js";
import { CoValueCore, accountOrAgentIDfromSessionID } from "../coValueCore.js";
import { AccountID, isAccountID } from "../account.js";
import { Group } from "../group.js";
import { parseJSON } from "../jsonStringify.js";

type MapOp<K extends string, V extends JsonValue | CoValueImpl | undefined> = {
    txID: TransactionID;
    madeAt: number;
    changeIdx: number;
} & MapOpPayload<K, V>;
// TODO: add after TransactionID[] for conflicts/ordering

export type MapOpPayload<
    K extends string,
    V extends JsonValue | CoValueImpl | undefined
> =
    | {
          op: "set";
          key: K;
          value: V extends CoValueImpl ? CoID<V> : Exclude<V, CoValueImpl>;
      }
    | {
          op: "del";
          key: K;
      };

/** A collaborative map with precise shape `M` and optional static metadata `Meta` */
export class CoMap<
    M extends { [key: string]: JsonValue | CoValueImpl | undefined },
    Meta extends JsonObject | null = null
> implements ReadableCoValue
{
    id: CoID<CoMap<M, Meta>>;
    type = "comap" as const;
    core: CoValueCore;
    /** @internal */
    ops: {
        [Key in keyof M & string]?: MapOp<Key, M[Key]>[];
    };

    /** @internal */
    constructor(core: CoValueCore) {
        this.id = core.id as CoID<CoMap<M, Meta>>;
        this.core = core;
        this.ops = {};

        this.fillOpsFromCoValue();
    }

    get meta(): Meta {
        return this.core.header.meta as Meta;
    }

    get group(): Group {
        return this.core.getGroup();
    }

    /** @internal */
    protected fillOpsFromCoValue() {
        this.ops = {};

        for (const {
            txID,
            changes,
            madeAt,
        } of this.core.getValidSortedTransactions()) {
            for (const [changeIdx, changeUntyped] of parseJSON(
                changes
            ).entries()) {
                const change = changeUntyped as MapOpPayload<
                    keyof M & string,
                    M[keyof M & string]
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
                        keyof M & string,
                        M[keyof M & string]
                    >),
                });
            }
        }
    }

    keys(): (keyof M & string)[] {
        return Object.keys(this.ops) as (keyof M & string)[];
    }

    /** Returns the current value for the given key. */
    get<K extends keyof M & string>(
        key: K
    ):
        | (M[K] extends CoValueImpl ? CoID<M[K]> : Exclude<M[K], CoValueImpl>)
        | undefined {
        const ops = this.ops[key];
        if (!ops) {
            return undefined;
        }

        const lastEntry = ops[ops.length - 1]!;

        if (lastEntry.op === "del") {
            return undefined;
        } else {
            return lastEntry.value;
        }
    }

    getAtTime<K extends keyof M & string>(
        key: K,
        time: number
    ):
        | (M[K] extends CoValueImpl ? CoID<M[K]> : Exclude<M[K], CoValueImpl>)
        | undefined {
        const ops = this.ops[key];
        if (!ops) {
            return undefined;
        }

        const lastOpBeforeOrAtTime = ops.findLast((op) => op.madeAt <= time);

        if (!lastOpBeforeOrAtTime) {
            return undefined;
        }

        if (lastOpBeforeOrAtTime.op === "del") {
            return undefined;
        } else {
            return lastOpBeforeOrAtTime.value;
        }
    }

    /** Returns the accountID of the last account to modify the value for the given key. */
    whoEdited<K extends keyof M & string>(key: K): AccountID | undefined {
        const tx = this.getLastTxID(key);
        if (!tx) {
            return undefined;
        }
        const accountID = accountOrAgentIDfromSessionID(tx.sessionID);
        if (isAccountID(accountID)) {
            return accountID;
        } else {
            return undefined;
        }
    }

    getLastTxID<K extends keyof M & string>(key: K): TransactionID | undefined {
        const ops = this.ops[key];
        if (!ops) {
            return undefined;
        }

        const lastEntry = ops[ops.length - 1]!;

        return lastEntry.txID;
    }

    getLastEntry<K extends keyof M & string>(
        key: K
    ):
        | {
              at: number;
              txID: TransactionID;
              value: M[K] extends CoValueImpl
                  ? CoID<M[K]>
                  : Exclude<M[K], CoValueImpl>;
          }
        | undefined {
        const ops = this.ops[key];
        if (!ops) {
            return undefined;
        }

        const lastEntry = ops[ops.length - 1]!;

        if (lastEntry.op === "del") {
            return undefined;
        } else {
            return {
                at: lastEntry.madeAt,
                txID: lastEntry.txID,
                value: lastEntry.value,
            };
        }
    }

    getHistory<K extends keyof M & string>(
        key: K
    ): {
        at: number;
        txID: TransactionID;
        value:
            | (M[K] extends CoValueImpl
                  ? CoID<M[K]>
                  : Exclude<M[K], CoValueImpl>)
            | undefined;
    }[] {
        const ops = this.ops[key];
        if (!ops) {
            return [];
        }

        const history: {
            at: number;
            txID: TransactionID;
            value:
                | (M[K] extends CoValueImpl
                      ? CoID<M[K]>
                      : Exclude<M[K], CoValueImpl>)
                | undefined;
        }[] = [];

        for (const op of ops) {
            if (op.op === "del") {
                history.push({
                    at: op.madeAt,
                    txID: op.txID,
                    value: undefined,
                });
            } else {
                history.push({ at: op.madeAt, txID: op.txID, value: op.value });
            }
        }

        return history;
    }

    toJSON(): JsonObject {
        const json: JsonObject = {};

        for (const key of this.keys()) {
            const value = this.get(key);
            if (value !== undefined) {
                json[key] = value;
            }
        }

        return json;
    }

    subscribe(listener: (coMap: CoMap<M, Meta>) => void): () => void {
        return this.core.subscribe((content) => {
            listener(content as CoMap<M, Meta>);
        });
    }

    edit(changer: (editable: WriteableCoMap<M, Meta>) => void): CoMap<M, Meta> {
        const editable = new WriteableCoMap<M, Meta>(this.core);
        changer(editable);
        return new CoMap(this.core);
    }
}

export class WriteableCoMap<
        M extends { [key: string]: JsonValue | CoValueImpl | undefined },
        Meta extends JsonObject | null = null
    >
    extends CoMap<M, Meta>
    implements WriteableCoValue
{
    /** @internal */
    edit(
        _changer: (editable: WriteableCoMap<M, Meta>) => void
    ): CoMap<M, Meta> {
        throw new Error("Already editing.");
    }

    /** Sets a new value for the given key.
     *
     * If `privacy` is `"private"` **(default)**, both `key` and `value` are encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, both `key` and `value` are stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers. */
    set<K extends keyof M & string>(
        key: K,
        value: M[K] extends CoValueImpl ? M[K] | CoID<M[K]> : M[K],
        privacy: "private" | "trusting" = "private"
    ): void {
        this.core.makeTransaction(
            [
                {
                    op: "set",
                    key,
                    value: isCoValueImpl(value) ? value.id : value,
                },
            ],
            privacy
        );

        this.fillOpsFromCoValue();
    }

    /** Deletes the value for the given key (setting it to undefined).
     *
     * If `privacy` is `"private"` **(default)**, `key` is encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, `key` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers. */
    delete(
        key: keyof M & string,
        privacy: "private" | "trusting" = "private"
    ): void {
        this.core.makeTransaction(
            [
                {
                    op: "del",
                    key,
                },
            ],
            privacy
        );

        this.fillOpsFromCoValue();
    }
}
