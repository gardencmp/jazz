import { JsonObject, JsonValue } from '../jsonValue.js';
import { TransactionID } from '../ids.js';
import { CoID } from '../contentType.js';
import { CoValue, accountOrAgentIDfromSessionID } from '../coValue.js';
import { AccountID, isAccountID } from '../account.js';

type MapOp<K extends string, V extends JsonValue> = {
    txID: TransactionID;
    madeAt: number;
    changeIdx: number;
} & MapOpPayload<K, V>;
// TODO: add after TransactionID[] for conflicts/ordering

export type MapOpPayload<K extends string, V extends JsonValue> = {
    op: "set";
    key: K;
    value: V;
} |
{
    op: "del";
    key: K;
};

export type MapK<M extends { [key: string]: JsonValue; }> = keyof M & string;
export type MapV<M extends { [key: string]: JsonValue; }> = M[MapK<M>];
export type MapM<M extends { [key: string]: JsonValue; }> = {
    [KK in MapK<M>]: M[KK];
}

export class CoMap<
    M extends { [key: string]: JsonValue; },
    Meta extends JsonObject | null = null,
> {
    id: CoID<CoMap<MapM<M>, Meta>>;
    coValue: CoValue;
    type = "comap" as const;
    ops: {
        [KK in MapK<M>]?: MapOp<KK, M[KK]>[];
    };

    constructor(coValue: CoValue) {
        this.id = coValue.id as CoID<CoMap<MapM<M>, Meta>>;
        this.coValue = coValue;
        this.ops = {};

        this.fillOpsFromCoValue();
    }

    protected fillOpsFromCoValue() {
        this.ops = {};

        for (const { txID, changes, madeAt } of this.coValue.getValidSortedTransactions()) {
            for (const [changeIdx, changeUntyped] of (
                changes
            ).entries()) {
                const change = changeUntyped as MapOpPayload<MapK<M>, MapV<M>>;
                let entries = this.ops[change.key];
                if (!entries) {
                    entries = [];
                    this.ops[change.key] = entries;
                }
                entries.push({
                    txID,
                    madeAt,
                    changeIdx,
                    ...(change as MapOpPayload<MapK<M>, MapV<M>>),
                });
            }
        }
    }

    keys(): MapK<M>[] {
        return Object.keys(this.ops) as MapK<M>[];
    }

    get<K extends MapK<M>>(key: K): M[K] | undefined {
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

    getAtTime<K extends MapK<M>>(key: K, time: number): M[K] | undefined {
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

    getLastEditor<K extends MapK<M>>(key: K): AccountID | undefined {
        const tx  = this.getLastTxID(key);
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

    getLastTxID<K extends MapK<M>>(key: K): TransactionID | undefined {
        const ops = this.ops[key];
        if (!ops) {
            return undefined;
        }

        const lastEntry = ops[ops.length - 1]!;

        return lastEntry.txID;
    }

    getLastEntry<K extends MapK<M>>(key: K): { at: number; txID: TransactionID; value: M[K]; } | undefined {
        const ops = this.ops[key];
        if (!ops) {
            return undefined;
        }

        const lastEntry = ops[ops.length - 1]!;

        if (lastEntry.op === "del") {
            return undefined;
        } else {
            return { at: lastEntry.madeAt, txID: lastEntry.txID, value: lastEntry.value };
        }
    }

    getHistory<K extends MapK<M>>(key: K): { at: number; txID: TransactionID; value: M[K] | undefined; }[] {
        const ops = this.ops[key];
        if (!ops) {
            return [];
        }

        const history: { at: number; txID: TransactionID; value: M[K] | undefined; }[] = [];

        for (const op of ops) {
            if (op.op === "del") {
                history.push({ at: op.madeAt, txID: op.txID, value: undefined });
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

    edit(changer: (editable: WriteableCoMap<M, Meta>) => void): CoMap<M, Meta> {
        const editable = new WriteableCoMap<M, Meta>(this.coValue);
        changer(editable);
        return new CoMap(this.coValue);
    }

    subscribe(listener: (coMap: CoMap<M, Meta>) => void): () => void {
        return this.coValue.subscribe((content) => {
            listener(content as CoMap<M, Meta>);
        });
    }
}

export class WriteableCoMap<
    M extends { [key: string]: JsonValue; },
    Meta extends JsonObject | null = null,

> extends CoMap<M, Meta> {
    set<K extends MapK<M>>(key: K, value: M[K], privacy: "private" | "trusting" = "private"): void {
        this.coValue.makeTransaction([
            {
                op: "set",
                key,
                value,
            },
        ], privacy);

        this.fillOpsFromCoValue();
    }

    delete(key: MapK<M>, privacy: "private" | "trusting" = "private"): void {
        this.coValue.makeTransaction([
            {
                op: "del",
                key,
            },
        ], privacy);

        this.fillOpsFromCoValue();
    }
}
