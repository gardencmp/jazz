import { JsonObject, JsonValue } from "../jsonValue.js";
import { CoID } from "../contentType.js";
import { CoValue, accountOrAgentIDfromSessionID } from "../coValue.js";
import { SessionID, TransactionID } from "../ids.js";
import { AccountID, Group } from "../index.js";
import { isAccountID } from "../account.js";

type OpID = TransactionID & { changeIdx: number };

type InsertionOpPayload<T extends JsonValue> =
    | {
          op: "pre";
          value: T;
          before: OpID | "end";
      }
    | {
          op: "app";
          value: T;
          after: OpID | "start";
      };

type DeletionOpPayload = {
    op: "del";
    insertion: OpID;
};

export type ListOpPayload<T extends JsonValue> =
    | InsertionOpPayload<T>
    | DeletionOpPayload;

type InsertionEntry<T extends JsonValue> = {
    madeAt: number;
    predecessors: OpID[];
    successors: OpID[];
} & InsertionOpPayload<T>;

type DeletionEntry = {
    madeAt: number;
    deletionID: OpID;
} & DeletionOpPayload;

export class CoList<
    T extends JsonValue,
    Meta extends JsonObject | null = null
> {
    id: CoID<CoList<T, Meta>>;
    type = "colist" as const;
    coValue: CoValue;
    afterStart: OpID[];
    beforeEnd: OpID[];
    insertions: {
        [sessionID: SessionID]: {
            [txIdx: number]: {
                [changeIdx: number]: InsertionEntry<T>;
            };
        };
    };
    deletionsByInsertion: {
        [deletedSessionID: SessionID]: {
            [deletedTxIdx: number]: {
                [deletedChangeIdx: number]: DeletionEntry[];
            };
        };
    };

    constructor(coValue: CoValue) {
        this.id = coValue.id as CoID<CoList<T, Meta>>;
        this.coValue = coValue;
        this.afterStart = [];
        this.beforeEnd = [];
        this.insertions = {};
        this.deletionsByInsertion = {};

        this.fillOpsFromCoValue();
    }


    get meta(): Meta {
        return this.coValue.header.meta as Meta;
    }

    get group(): Group {
        return this.coValue.getGroup();
    }

    protected fillOpsFromCoValue() {
        this.insertions = {};
        this.deletionsByInsertion = {};
        this.afterStart = [];
        this.beforeEnd = [];

        for (const {
            txID,
            changes,
            madeAt,
        } of this.coValue.getValidSortedTransactions()) {
            for (const [changeIdx, changeUntyped] of changes.entries()) {
                const change = changeUntyped as ListOpPayload<T>;

                if (change.op === "pre" || change.op === "app") {
                    let sessionEntry = this.insertions[txID.sessionID];
                    if (!sessionEntry) {
                        sessionEntry = {};
                        this.insertions[txID.sessionID] = sessionEntry;
                    }
                    let txEntry = sessionEntry[txID.txIndex];
                    if (!txEntry) {
                        txEntry = {};
                        sessionEntry[txID.txIndex] = txEntry;
                    }
                    txEntry[changeIdx] = {
                        madeAt,
                        predecessors: [],
                        successors: [],
                        ...change,
                    };
                    if (change.op === "pre") {
                        if (change.before === "end") {
                            this.beforeEnd.push({
                                ...txID,
                                changeIdx,
                            });
                        } else {
                            const beforeEntry =
                                this.insertions[change.before.sessionID]?.[
                                    change.before.txIndex
                                ]?.[change.before.changeIdx];
                            if (!beforeEntry) {
                                throw new Error(
                                    "Not yet implemented: insertion before missing op " +
                                        change.before
                                );
                            }
                            beforeEntry.predecessors.splice(0, 0, {
                                ...txID,
                                changeIdx,
                            });
                        }
                    } else {
                        if (change.after === "start") {
                            this.afterStart.push({
                                ...txID,
                                changeIdx,
                            });
                        } else {
                            const afterEntry =
                                this.insertions[change.after.sessionID]?.[
                                    change.after.txIndex
                                ]?.[change.after.changeIdx];
                            if (!afterEntry) {
                                throw new Error(
                                    "Not yet implemented: insertion after missing op " +
                                        change.after
                                );
                            }
                            afterEntry.successors.push({
                                ...txID,
                                changeIdx,
                            });
                        }
                    }
                } else if (change.op === "del") {
                    let sessionEntry =
                        this.deletionsByInsertion[change.insertion.sessionID];
                    if (!sessionEntry) {
                        sessionEntry = {};
                        this.deletionsByInsertion[change.insertion.sessionID] =
                            sessionEntry;
                    }
                    let txEntry = sessionEntry[change.insertion.txIndex];
                    if (!txEntry) {
                        txEntry = {};
                        sessionEntry[change.insertion.txIndex] = txEntry;
                    }
                    let changeEntry = txEntry[change.insertion.changeIdx];
                    if (!changeEntry) {
                        changeEntry = [];
                        txEntry[change.insertion.changeIdx] = changeEntry;
                    }
                    changeEntry.push({
                        madeAt,
                        deletionID: {
                            ...txID,
                            changeIdx,
                        },
                        ...change,
                    });
                } else {
                    throw new Error(
                        "Unknown list operation " +
                            (change as { op: unknown }).op
                    );
                }
            }
        }
    }

    entries(): { value: T; madeAt: number; opID: OpID }[] {
        const arr: { value: T; madeAt: number; opID: OpID }[] = [];
        for (const opID of this.afterStart) {
            this.fillArrayFromOpID(opID, arr);
        }
        for (const opID of this.beforeEnd) {
            this.fillArrayFromOpID(opID, arr);
        }
        return arr;
    }

    private fillArrayFromOpID(
        opID: OpID,
        arr: { value: T; madeAt: number; opID: OpID }[]
    ) {
        const entry =
            this.insertions[opID.sessionID]?.[opID.txIndex]?.[opID.changeIdx];
        if (!entry) {
            throw new Error("Missing op " + opID);
        }
        for (const predecessor of entry.predecessors) {
            this.fillArrayFromOpID(predecessor, arr);
        }
        const deleted =
            (this.deletionsByInsertion[opID.sessionID]?.[opID.txIndex]?.[
                opID.changeIdx
            ]?.length || 0) > 0;
        if (!deleted) {
            arr.push({
                value: entry.value,
                madeAt: entry.madeAt,
                opID,
            });
        }
        for (const successor of entry.successors) {
            this.fillArrayFromOpID(successor, arr);
        }
    }

    whoInserted(idx: number): AccountID | undefined {
        const entry = this.entries()[idx];
        if (!entry) {
            return undefined;
        }
        const accountID = accountOrAgentIDfromSessionID(entry.opID.sessionID);
        if (isAccountID(accountID)) {
            return accountID;
        } else {
            return undefined;
        }
    }

    toJSON(): T[] {
        return this.asArray();
    }

    asArray(): T[] {
        return this.entries().map((entry) => entry.value);
    }

    map<U>(mapper: (value: T, idx: number) => U): U[] {
        return this.entries().map((entry, idx) => mapper(entry.value, idx));
    }

    filter<U extends T>(predicate: (value: T, idx: number) => value is U): U[]
    filter(predicate: (value: T, idx: number) => boolean): T[] {
        return this.entries()
            .filter((entry, idx) => predicate(entry.value, idx))
            .map((entry) => entry.value);
    }

    reduce<U>(
        reducer: (accumulator: U, value: T, idx: number) => U,
        initialValue: U
    ): U {
        return this.entries().reduce(
            (accumulator, entry, idx) =>
                reducer(accumulator, entry.value, idx),
            initialValue
        );
    }

    edit(
        changer: (editable: WriteableCoList<T, Meta>) => void
    ): CoList<T, Meta> {
        const editable = new WriteableCoList<T, Meta>(this.coValue);
        changer(editable);
        return new CoList(this.coValue);
    }

    subscribe(listener: (coMap: CoList<T, Meta>) => void): () => void {
        return this.coValue.subscribe((content) => {
            listener(content as CoList<T, Meta>);
        });
    }
}

export class WriteableCoList<
    T extends JsonValue,
    Meta extends JsonObject | null = null
> extends CoList<T, Meta> {
    append(
        after: number,
        value: T,
        privacy: "private" | "trusting" = "private"
    ): void {
        const entries = this.entries();
        let opIDBefore;
        if (entries.length > 0) {
            const entryBefore = entries[after];
            if (!entryBefore) {
                throw new Error("Invalid index " + after);
            }
            opIDBefore = entryBefore.opID;
        } else {
            if (after !== 0) {
                throw new Error("Invalid index " + after);
            }
            opIDBefore = "start";
        }
        this.coValue.makeTransaction(
            [
                {
                    op: "app",
                    value,
                    after: opIDBefore,
                },
            ],
            privacy
        );

        this.fillOpsFromCoValue();
    }

    push(value: T, privacy: "private" | "trusting" = "private"): void {
        // TODO: optimize
        const entries = this.entries();
        this.append(entries.length > 0 ? entries.length - 1 : 0, value, privacy);
    }

    prepend(
        before: number,
        value: T,
        privacy: "private" | "trusting" = "private"
    ): void {
        const entries = this.entries();
        let opIDAfter;
        if (entries.length > 0) {
            const entryAfter = entries[before];
            if (entryAfter) {
                opIDAfter = entryAfter.opID;
            } else {
                if (before !== entries.length) {
                    throw new Error("Invalid index " + before);
                }
                opIDAfter = "end";
            }
        } else {
            if (before !== 0) {
                throw new Error("Invalid index " + before);
            }
            opIDAfter = "end";
        }
        this.coValue.makeTransaction(
            [
                {
                    op: "pre",
                    value,
                    before: opIDAfter,
                },
            ],
            privacy
        );

        this.fillOpsFromCoValue();
    }

    delete(
        at: number,
        privacy: "private" | "trusting" = "private"
    ): void {
        const entries = this.entries();
        const entry = entries[at];
        if (!entry) {
            throw new Error("Invalid index " + at);
        }
        this.coValue.makeTransaction(
            [
                {
                    op: "del",
                    insertion: entry.opID,
                },
            ],
            privacy
        );

        this.fillOpsFromCoValue();
    }
}
