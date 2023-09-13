import { JsonObject, JsonValue } from "../jsonValue.js";
import { CoID, CoValueImpl, ReadableCoValue, WriteableCoValue, isCoValueImpl } from "../coValue.js";
import { CoValueCore, accountOrAgentIDfromSessionID } from "../coValueCore.js";
import { SessionID, TransactionID } from "../ids.js";
import { Group } from "../group.js";
import { AccountID, isAccountID } from "../account.js";
import { parseJSON } from "../jsonStringify.js";

type OpID = TransactionID & { changeIdx: number };

type InsertionOpPayload<T extends JsonValue | CoValueImpl> =
    | {
          op: "pre";
          value: T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>;
          before: OpID | "end";
      }
    | {
          op: "app";
          value: T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>;
          after: OpID | "start";
      };

type DeletionOpPayload = {
    op: "del";
    insertion: OpID;
};

export type ListOpPayload<T extends JsonValue | CoValueImpl> =
    | InsertionOpPayload<T>
    | DeletionOpPayload;

type InsertionEntry<T extends JsonValue| CoValueImpl> = {
    madeAt: number;
    predecessors: OpID[];
    successors: OpID[];
} & InsertionOpPayload<T>;

type DeletionEntry = {
    madeAt: number;
    deletionID: OpID;
} & DeletionOpPayload;

export class CoList<T extends JsonValue| CoValueImpl, Meta extends JsonObject | null = null>
    implements ReadableCoValue
{
    id: CoID<CoList<T, Meta>>;
    type = "colist" as const;
    core: CoValueCore;
    /** @internal */
    afterStart: OpID[];
    /** @internal */
    beforeEnd: OpID[];
    /** @internal */
    insertions: {
        [sessionID: SessionID]: {
            [txIdx: number]: {
                [changeIdx: number]: InsertionEntry<T>;
            };
        };
    };
    /** @internal */
    deletionsByInsertion: {
        [deletedSessionID: SessionID]: {
            [deletedTxIdx: number]: {
                [deletedChangeIdx: number]: DeletionEntry[];
            };
        };
    };

    /** @internal */
    constructor(core: CoValueCore) {
        this.id = core.id as CoID<CoList<T, Meta>>;
        this.core = core;
        this.afterStart = [];
        this.beforeEnd = [];
        this.insertions = {};
        this.deletionsByInsertion = {};

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
        this.insertions = {};
        this.deletionsByInsertion = {};
        this.afterStart = [];
        this.beforeEnd = [];

        for (const {
            txID,
            changes,
            madeAt,
        } of this.core.getValidSortedTransactions()) {
            for (const [changeIdx, changeUntyped] of parseJSON(changes).entries()) {
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

    /** Get the item currently at `idx`. */
    get(idx: number): (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>) | undefined {
        const entry = this.entries()[idx];
        if (!entry) {
            return undefined;
        }
        return entry.value;
    }

    /** Returns the current items in the CoList as an array. */
    asArray(): (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>)[] {
        return this.entries().map((entry) => entry.value);
    }

    entries(): { value: (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>); madeAt: number; opID: OpID }[] {
        const arr: { value: (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>); madeAt: number; opID: OpID }[] = [];
        for (const opID of this.afterStart) {
            this.fillArrayFromOpID(opID, arr);
        }
        for (const opID of this.beforeEnd) {
            this.fillArrayFromOpID(opID, arr);
        }
        return arr;
    }

    /** @internal */
    private fillArrayFromOpID(
        opID: OpID,
        arr: { value: (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>); madeAt: number; opID: OpID }[]
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

    /** Returns the accountID of the account that inserted value at the given index. */
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

    /** Returns the current items in the CoList as an array. (alias of `asArray`) */
    toJSON(): (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>)[] {
        return this.asArray();
    }

    map<U>(mapper: (value: (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>), idx: number) => U): U[] {
        return this.entries().map((entry, idx) => mapper(entry.value, idx));
    }

    filter<U extends (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>)>(predicate: (value: (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>), idx: number) => value is U): U[];
    filter(predicate: (value: (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>), idx: number) => boolean): (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>)[] {
        return this.entries()
            .filter((entry, idx) => predicate(entry.value, idx))
            .map((entry) => entry.value);
    }

    reduce<U>(
        reducer: (accumulator: U, value: (T extends CoValueImpl ? CoID<T> : Exclude<T, CoValueImpl>), idx: number) => U,
        initialValue: U
    ): U {
        return this.entries().reduce(
            (accumulator, entry, idx) => reducer(accumulator, entry.value, idx),
            initialValue
        );
    }

    subscribe(listener: (coMap: CoList<T, Meta>) => void): () => void {
        return this.core.subscribe((content) => {
            listener(content as CoList<T, Meta>);
        });
    }

    edit(
        changer: (editable: WriteableCoList<T, Meta>) => void
    ): CoList<T, Meta> {
        const editable = new WriteableCoList<T, Meta>(this.core);
        changer(editable);
        return new CoList(this.core);
    }
}

export class WriteableCoList<
        T extends JsonValue | CoValueImpl,
        Meta extends JsonObject | null = null
    >
    extends CoList<T, Meta>
    implements WriteableCoValue
{
    /** @internal */
    edit(
        _changer: (editable: WriteableCoList<T, Meta>) => void
    ): CoList<T, Meta> {
        throw new Error("Already editing.");
    }

    /** Appends a new item after index `after`.
     *
     * If `privacy` is `"private"` **(default)**, both `value` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, both `value` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers. */
    append(
        after: number,
        value: T extends CoValueImpl ? T | CoID<T> : T,
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
        this.core.makeTransaction(
            [
                {
                    op: "app",
                    value: isCoValueImpl(value) ? value.id : value,
                    after: opIDBefore,
                },
            ],
            privacy
        );

        this.fillOpsFromCoValue();
    }

    /** Pushes a new item to the end of the list.
     *
     * If `privacy` is `"private"` **(default)**, both `value` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, both `value` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers. */
    push(value: T extends CoValueImpl ? T | CoID<T> : T, privacy: "private" | "trusting" = "private"): void {
        // TODO: optimize
        const entries = this.entries();
        this.append(
            entries.length > 0 ? entries.length - 1 : 0,
            value,
            privacy
        );
    }

    /**
     * Prepends a new item before index `before`.
     *
     * If `privacy` is `"private"` **(default)**, both `value` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, both `value` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     */
    prepend(
        before: number,
        value: T extends CoValueImpl ? T | CoID<T> : T,
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
        this.core.makeTransaction(
            [
                {
                    op: "pre",
                    value: isCoValueImpl(value) ? value.id : value,
                    before: opIDAfter,
                },
            ],
            privacy
        );

        this.fillOpsFromCoValue();
    }

    /** Deletes the item at index `at` from the list.
     *
     * If `privacy` is `"private"` **(default)**, the fact of this deletion is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, the fact of this deletion is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers. */
    delete(at: number, privacy: "private" | "trusting" = "private"): void {
        const entries = this.entries();
        const entry = entries[at];
        if (!entry) {
            throw new Error("Invalid index " + at);
        }
        this.core.makeTransaction(
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
