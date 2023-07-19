import { JsonAtom, JsonObject, JsonValue } from "./jsonValue";
import { MultiLog, MultiLogID, TransactionID } from "./multilog";

export type CoValueID<T extends CoValue> = MultiLogID & {
    readonly __type: T;
};

export type CoValue =
    | CoMap<string, JsonValue, JsonValue>
    | CoList<JsonValue, JsonValue>
    | MultiStream<JsonValue, JsonValue>
    | Static<JsonValue>;

type MapOp<K extends string, V extends JsonValue> = {
    txID: TransactionID;
    madeAt: number;
    changeIdx: number;
} & MapOpPayload<K, V>;

// TODO: add after TransactionID[] for conflicts/ordering
export type MapOpPayload<K extends string, V extends JsonValue> =
    | {
          op: "insert";
          key: K;
          value: V;
      }
    | {
          op: "delete";
          key: K;
      };

export class CoMap<
    K extends string,
    V extends JsonValue,
    Meta extends JsonValue
> {
    id: CoValueID<CoMap<K, V, Meta>>;
    multiLog: MultiLog;
    type: "comap" = "comap";
    ops: Map<K, MapOp<K, V>[]>;

    constructor(multiLog: MultiLog) {
        this.id = multiLog.id as CoValueID<CoMap<K, V, Meta>>;
        this.multiLog = multiLog;
        this.ops = new Map();

        this.fillOpsFromMultilog();
    }

    protected fillOpsFromMultilog() {
        for (const { txID, changes, madeAt } of this.multiLog.getValidSortedTransactions()) {
            for (const [changeIdx, change] of (
                changes as MapOpPayload<K, V>[]
            ).entries()) {
                let entries = this.ops.get(change.key);
                if (!entries) {
                    entries = [];
                    this.ops.set(change.key, entries);
                }
                entries.push({
                    txID,
                    madeAt,
                    changeIdx,
                    ...change,
                });
            }
        }
    }

    keys(): IterableIterator<K> {
        return this.ops.keys();
    }

    get(key: K): V | undefined {
        const ops = this.ops.get(key);
        if (!ops) {
            return undefined;
        }

        let lastEntry = ops[ops.length - 1];

        if (lastEntry.op === "delete") {
            return undefined;
        } else {
            return lastEntry.value;
        }
    }

    getAtTime(key: K, time: number): V | undefined {
        const ops = this.ops.get(key);
        if (!ops) {
            return undefined;
        }

        const lastOpBeforeOrAtTime = ops.findLast((op) => op.madeAt <= time);

        if (!lastOpBeforeOrAtTime) {
            return undefined;
        }

        if (lastOpBeforeOrAtTime.op === "delete") {
            return undefined;
        } else {
            return lastOpBeforeOrAtTime.value;
        }
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

    edit(changer: (editable: WriteableCoMap<K, V, Meta>) => void): void {
        const editable = new WriteableCoMap<K, V, Meta>(this.multiLog);
        changer(editable);
    }
}

export class WriteableCoMap<
    K extends string,
    V extends JsonValue,
    Meta extends JsonValue
> extends CoMap<K, V, Meta> {
    // TODO: change default to private
    set(key: K, value: V, privacy: "private" | "trusting" = "trusting"): void {
        this.multiLog.makeTransaction([
            {
                op: "insert",
                key,
                value,
            },
        ], privacy);

        this.fillOpsFromMultilog();
    }

    // TODO: change default to private
    delete(key: K, privacy: "private" | "trusting" = "trusting"): void {
        this.multiLog.makeTransaction([
            {
                op: "delete",
                key,
            },
        ], privacy);

        this.fillOpsFromMultilog();
    }
}

export class CoList<T extends JsonValue, Meta extends JsonValue> {
    id: CoValueID<CoList<T, Meta>>;
    type: "colist" = "colist";

    constructor(multilog: MultiLog) {
        this.id = multilog.id as CoValueID<CoList<T, Meta>>;
    }
}

export class MultiStream<T extends JsonValue, Meta extends JsonValue> {
    id: CoValueID<MultiStream<T, Meta>>;
    type: "multistream" = "multistream";

    constructor(multilog: MultiLog) {
        this.id = multilog.id as CoValueID<MultiStream<T, Meta>>;
    }
}

export class Static<T extends JsonValue> {
    id: CoValueID<Static<T>>;
    type: "static" = "static";

    constructor(multilog: MultiLog) {
        this.id = multilog.id as CoValueID<Static<T>>;
    }
}
