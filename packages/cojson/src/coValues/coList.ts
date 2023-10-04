import { JsonObject, JsonValue } from "../jsonValue.js";
import { CoID, CoValue } from "../coValue.js";
import { isCoValue } from "../typeCheckers.js";
import { CoValueCore, accountOrAgentIDfromSessionID } from "../coValueCore.js";
import { AgentID, SessionID, TransactionID } from "../ids.js";
import { AccountID } from "./account.js";
import { parseJSON } from "../jsonStringify.js";
import { Group } from "./group.js";

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

export class CoListView<
    Item extends JsonValue = JsonValue,
    Meta extends JsonObject | null = null
> implements CoValue
{
    /** @category 6. Meta */
    id: CoID<this>;
    /** @category 6. Meta */
    type = "colist" as const;
    /** @category 6. Meta */
    core: CoValueCore;
    /** @internal */
    afterStart: OpID[];
    /** @internal */
    beforeEnd: OpID[];
    /** @internal */
    insertions: {
        [sessionID: SessionID]: {
            [txIdx: number]: {
                [changeIdx: number]: InsertionEntry<Item>;
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
    /** @category 6. Meta */
    readonly _item!: Item;

    /** @internal */
    constructor(core: CoValueCore) {
        this.id = core.id as CoID<this>;
        this.core = core;
        this.afterStart = [];
        this.beforeEnd = [];
        this.insertions = {};
        this.deletionsByInsertion = {};

        this.insertions = {};
        this.deletionsByInsertion = {};
        this.afterStart = [];
        this.beforeEnd = [];

        for (const {
            txID,
            changes,
            madeAt,
        } of this.core.getValidSortedTransactions()) {
            for (const [changeIdx, changeUntyped] of parseJSON(
                changes
            ).entries()) {
                const change = changeUntyped as ListOpPayload<Item>;

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

    /** @category 6. Meta */
    get headerMeta(): Meta {
        return this.core.header.meta as Meta;
    }

    /** @category 6. Meta */
    get group(): Group {
        return this.core.getGroup();
    }

    /**
     * Not yet implemented
     *
     * @category 4. Time travel
     */
    atTime(_time: number): this {
        throw new Error("Not yet implemented");
    }

    /**
     * Get the item currently at `idx`.
     *
     * @category 1. Reading
     */
    get(idx: number): Item | undefined {
        const entry = this.entries()[idx];
        if (!entry) {
            return undefined;
        }
        return entry.value;
    }

    /**
     * Returns the current items in the CoList as an array.
     *
     * @category 1. Reading
     **/
    asArray(): Item[] {
        return this.entries().map((entry) => entry.value);
    }

    /** @internal */
    entries(): {
        value: Item;
        madeAt: number;
        opID: OpID;
    }[] {
        const arr: {
            value: Item;
            madeAt: number;
            opID: OpID;
        }[] = [];
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
        arr: {
            value: Item;
            madeAt: number;
            opID: OpID;
        }[]
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

    /**
     * Returns the current items in the CoList as an array. (alias of `asArray`)
     *
     * @category 1. Reading
     */
    toJSON(): Item[] {
        return this.asArray();
    }

    /** @category 5. Edit history */
    editAt(idx: number):
        | {
              by: AccountID | AgentID;
              tx: TransactionID;
              at: Date;
              value: Item;
          }
        | undefined {
        const entry = this.entries()[idx];
        if (!entry) {
            return undefined;
        }
        const madeAt = new Date(entry.madeAt);
        const by = accountOrAgentIDfromSessionID(entry.opID.sessionID);
        const value = entry.value;
        return {
            by,
            tx: {
                sessionID: entry.opID.sessionID,
                txIndex: entry.opID.txIndex,
            },
            at: madeAt,
            value,
        };
    }

    /** @category 5. Edit history */
    deletionEdits(): {
        by: AccountID | AgentID;
        tx: TransactionID;
        at: Date;
        // TODO: add indices that are now before and after the deleted item
    }[] {
        const edits: {
            by: AccountID | AgentID;
            tx: TransactionID;
            at: Date;
        }[] = [];

        for (const sessionID in this.deletionsByInsertion) {
            const sessionEntry =
                this.deletionsByInsertion[sessionID as SessionID];
            for (const txIdx in sessionEntry) {
                const txEntry = sessionEntry[Number(txIdx)];
                for (const changeIdx in txEntry) {
                    const changeEntry = txEntry[Number(changeIdx)];
                    for (const deletion of changeEntry || []) {
                        const madeAt = new Date(deletion.madeAt);
                        const by = accountOrAgentIDfromSessionID(
                            deletion.deletionID.sessionID
                        );
                        edits.push({
                            by,
                            tx: deletion.deletionID,
                            at: madeAt,
                        });
                    }
                }
            }
        }

        return edits;
    }

    /** @category 3. Subscription */
    subscribe(listener: (coList: this) => void): () => void {
        return this.core.subscribe((content) => {
            listener(content as this);
        });
    }
}

export class CoList<
        Item extends JsonValue = JsonValue,
        Meta extends JsonObject | null = JsonObject | null
    >
    extends CoListView<Item, Meta>
    implements CoValue
{
    /** Returns a new version of this CoList with `item` appended after the item currently at index `after`.
     *
     * If `privacy` is `"private"` **(default)**, `item` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, `item` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     *
     * @category 2. Editing
     **/
    append(
        item: Item,
        after?: number,
        privacy: "private" | "trusting" = "private"
    ): this {
        const entries = this.entries();
        after =
            after === undefined
                ? entries.length > 0
                    ? entries.length - 1
                    : 0
                : 0;
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
                    value: isCoValue(item) ? item.id : item,
                    after: opIDBefore,
                },
            ],
            privacy
        );

        return new CoList(this.core) as this;
    }

    /**
     * Returns a new version of this CoList with `item` prepended before the item currently at index `before`.
     *
     * If `privacy` is `"private"` **(default)**, `item` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, `item` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     *
     * @category 2. Editing
     */
    prepend(
        item: Item,
        before?: number,
        privacy: "private" | "trusting" = "private"
    ): this {
        const entries = this.entries();
        before = before === undefined ? 0 : before;
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
                    value: isCoValue(item) ? item.id : item,
                    before: opIDAfter,
                },
            ],
            privacy
        );

        return new CoList(this.core) as this;
    }

    /** Returns a new version of this CoList with the item at index `at` deleted from the list.
     *
     * If `privacy` is `"private"` **(default)**, the fact of this deletion is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, the fact of this deletion is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     *
     * @category 2. Editing
     **/
    delete(at: number, privacy: "private" | "trusting" = "private"): this {
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

        return new CoList(this.core) as this;
    }

    /** @category 2. Editing */
    mutate(mutator: (mutable: MutableCoList<Item, Meta>) => void): this {
        const mutable = new MutableCoList<Item, Meta>(this.core);
        mutator(mutable);
        return new CoList(this.core) as this;
    }

    /** @deprecated Use `mutate` instead. */
    edit(mutator: (mutable: MutableCoList<Item, Meta>) => void): this {
        return this.mutate(mutator);
    }
}

export class MutableCoList<
        Item extends JsonValue = JsonValue,
        Meta extends JsonObject | null = JsonObject | null
    >
    extends CoListView<Item, Meta>
    implements CoValue
{
    /** Appends `item` after the item currently at index `after`.
     *
     * If `privacy` is `"private"` **(default)**, `item` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, `item` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     *
     * @category 2. Mutating
     **/
    append(
        item: Item,
        after?: number,
        privacy: "private" | "trusting" = "private"
    ): void {
        const listAfter = CoList.prototype.append.call(
            this,
            item,
            after,
            privacy
        ) as CoList<Item, Meta>;
        this.afterStart = listAfter.afterStart;
        this.beforeEnd = listAfter.beforeEnd;
        this.insertions = listAfter.insertions;
        this.deletionsByInsertion = listAfter.deletionsByInsertion;
    }

    /** Prepends `item` before the item currently at index `before`.
     *
     * If `privacy` is `"private"` **(default)**, `item` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, `item` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     *
     * * @category 2. Mutating
     **/
    prepend(
        item: Item,
        before?: number,
        privacy: "private" | "trusting" = "private"
    ): void {
        const listAfter = CoList.prototype.prepend.call(
            this,
            item,
            before,
            privacy
        ) as CoList<Item, Meta>;
        this.afterStart = listAfter.afterStart;
        this.beforeEnd = listAfter.beforeEnd;
        this.insertions = listAfter.insertions;
        this.deletionsByInsertion = listAfter.deletionsByInsertion;
    }

    /** Deletes the item at index `at` from the list.
     *
     * If `privacy` is `"private"` **(default)**, the fact of this deletion is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.
     *
     * If `privacy` is `"trusting"`, the fact of this deletion is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
     *
     * * @category 2. Mutating
     **/
    delete(at: number, privacy: "private" | "trusting" = "private"): void {
        const listAfter = CoList.prototype.delete.call(
            this,
            at,
            privacy
        ) as CoList<Item, Meta>;
        this.afterStart = listAfter.afterStart;
        this.beforeEnd = listAfter.beforeEnd;
        this.insertions = listAfter.insertions;
        this.deletionsByInsertion = listAfter.deletionsByInsertion;
    }
}
