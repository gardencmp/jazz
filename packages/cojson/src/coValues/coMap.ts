import { CoID, RawCoValue } from "../coValue.js";
import { CoValueCore, DecryptedTransaction } from "../coValueCore.js";
import { AgentID, SessionID, TransactionID } from "../ids.js";
import { JsonObject, JsonValue } from "../jsonValue.js";
import { accountOrAgentIDfromSessionID } from "../typeUtils/accountOrAgentIDfromSessionID.js";
import { isCoValue } from "../typeUtils/isCoValue.js";
import { RawAccountID } from "./account.js";
import type { RawGroup } from "./group.js";

type MapOp<K extends string, V extends JsonValue | undefined> = {
  txID: TransactionID;
  madeAt: number;
  changeIdx: number;
  change: MapOpPayload<K, V>;
};
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

export class RawCoMapView<
  Shape extends { [key: string]: JsonValue | undefined } = {
    [key: string]: JsonValue | undefined;
  },
  Meta extends JsonObject | null = JsonObject | null,
> implements RawCoValue
{
  /** @category 6. Meta */
  id: CoID<this>;
  /** @category 6. Meta */
  type = "comap" as const;
  /** @category 6. Meta */
  core: CoValueCore;
  /** @internal */
  latest: {
    [Key in keyof Shape & string]?: MapOp<Key, Shape[Key]>;
  };
  /** @internal */
  latestTxMadeAt: number;
  /** @internal */
  ops: {
    [Key in keyof Shape & string]?: MapOp<Key, Shape[Key]>[];
  };
  /** @internal */
  processedTransactionsSet: Set<`${SessionID}-${number}`>;

  /** @internal */
  ignorePrivateTransactions: boolean;
  /** @internal */
  atTimeFilter?: number = undefined;
  /** @category 6. Meta */
  readonly _shape!: Shape;

  /** @internal */
  constructor(
    core: CoValueCore,
    options?: {
      ignorePrivateTransactions: boolean;
    },
  ) {
    this.id = core.id as CoID<this>;
    this.core = core;
    this.latestTxMadeAt = 0;
    this.ignorePrivateTransactions =
      options?.ignorePrivateTransactions ?? false;
    this.ops = {};
    this.latest = {};
    this.processedTransactionsSet = new Set();

    this.processLatestTransactions();
  }

  private getNextValidTransactions() {
    const nextValidTransactions = this.core.getValidTransactions({
      ignorePrivateTransactions: this.ignorePrivateTransactions,
      exclude: this.processedTransactionsSet,
    });

    return nextValidTransactions;
  }

  private processLatestTransactions() {
    if (this.isTimeTravelEntity()) {
      throw new Error("Cannot process transactions on a time travel entity");
    }

    const { ops } = this;

    const changedEntries = new Map<
      keyof typeof ops,
      NonNullable<(typeof ops)[keyof typeof ops]>
    >();

    for (const { txID, changes, madeAt } of this.getNextValidTransactions()) {
      for (let changeIdx = 0; changeIdx < changes.length; changeIdx++) {
        const change = changes[changeIdx] as MapOpPayload<
          keyof Shape & string,
          Shape[keyof Shape & string]
        >;
        const entry = {
          txID,
          madeAt,
          changeIdx,
          change,
        };

        if (madeAt > this.latestTxMadeAt) {
          this.latestTxMadeAt = madeAt;
        }

        const entries = ops[change.key];
        if (!entries) {
          const entries = [entry];
          ops[change.key] = entries;
          changedEntries.set(change.key, entries);
        } else {
          entries.push(entry);
          changedEntries.set(change.key, entries);
        }
        this.processedTransactionsSet.add(`${txID.sessionID}-${txID.txIndex}`);
      }
    }

    for (const entries of changedEntries.values()) {
      entries.sort(this.core.compareTransactions);
    }

    for (const [key, entries] of changedEntries.entries()) {
      this.latest[key] = entries[entries.length - 1];
    }
  }

  isTimeTravelEntity() {
    return Boolean(this.atTimeFilter);
  }

  resetLatest() {
    this.latest = {};

    const atTimeFilter = this.atTimeFilter;

    for (const [key, entries] of Object.entries(this.ops)) {
      if (!entries) {
        continue;
      }

      for (const entry of entries) {
        if (atTimeFilter && entry.madeAt > atTimeFilter) {
          continue;
        }

        this.latest[key as keyof typeof this.latest] = entry;
      }
    }
  }

  revalidateTransactions() {
    this.processLatestTransactions();
  }

  /** @category 6. Meta */
  get headerMeta(): Meta {
    return this.core.header.meta as Meta;
  }

  /** @category 6. Meta */
  get group(): RawGroup {
    return this.core.getGroup();
  }

  /** @category 4. Time travel */
  atTime(time: number): this {
    if (time >= this.latestTxMadeAt) {
      return this;
    } else {
      const clone = Object.create(this);

      clone.atTimeFilter = time;
      clone.latest = {};
      clone.resetLatest();

      return clone as this;
    }
  }

  /** @internal */
  timeFilteredOps<K extends keyof Shape & string>(
    key: K,
  ): MapOp<K, Shape[K]>[] | undefined {
    if (key === "constructor") {
      return undefined;
    }

    const atTimeFilter = this.atTimeFilter;

    if (atTimeFilter) {
      return this.ops[key]?.filter((op) => op.madeAt <= atTimeFilter);
    } else {
      return this.ops[key];
    }
  }

  /**
   * Get all keys currently in the map.
   *
   * @category 1. Reading */
  keys<K extends keyof Shape & string = keyof Shape & string>(): K[] {
    return (Object.keys(this.latest) as K[]).filter((key) => {
      const latestChange = this.latest[key];

      if (!latestChange) {
        return false;
      }

      if (latestChange.change.op === "del") {
        return false;
      } else {
        return true;
      }
    });
  }

  /**
   * Returns the current value for the given key.
   *
   * @category 1. Reading
   **/
  get<K extends keyof Shape & string>(key: K): Shape[K] | undefined {
    const latestChange = this.latest[key];
    if (!latestChange) {
      return undefined;
    }

    if (latestChange.change.op === "del") {
      return undefined;
    } else {
      return latestChange.change.value as Shape[K];
    }
  }

  /** @category 1. Reading */
  asObject(): {
    [K in keyof Shape & string]: Shape[K];
  } {
    const object: Partial<{
      [K in keyof Shape & string]: Shape[K];
    }> = {};

    for (const key of Object.keys(this.latest) as (keyof Shape & string)[]) {
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
  nthEditAt<K extends keyof Shape & string>(key: K, n: number) {
    const ops = this.ops[key];

    const atTimeFilter = this.atTimeFilter;
    const entry = ops?.[n];

    if (!entry) {
      return undefined;
    }

    if (atTimeFilter && entry.madeAt > atTimeFilter) {
      return undefined;
    }

    return operationToEditEntry(entry);
  }

  /** @category 5. Edit history */
  lastEditAt<K extends keyof Shape & string>(
    key: K,
  ):
    | {
        by: RawAccountID | AgentID;
        tx: TransactionID;
        at: Date;
        value?: Shape[K];
      }
    | undefined {
    const ops = this.timeFilteredOps(key);
    const lastEntry = ops?.[ops.length - 1];

    if (!lastEntry) {
      return undefined;
    }

    return operationToEditEntry(lastEntry);
  }

  /** @category 5. Edit history */
  *editsAt<K extends keyof Shape & string>(key: K) {
    const ops = this.timeFilteredOps(key);
    if (!ops) {
      return;
    }

    for (const entry of ops) {
      yield operationToEditEntry(entry);
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
export class RawCoMap<
    Shape extends { [key: string]: JsonValue | undefined } = {
      [key: string]: JsonValue | undefined;
    },
    Meta extends JsonObject | null = JsonObject | null,
  >
  extends RawCoMapView<Shape, Meta>
  implements RawCoValue
{
  /** Set a new value for the given key.
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
    privacy: "private" | "trusting" = "private",
  ): void {
    if (this.isTimeTravelEntity()) {
      throw new Error("Cannot set value on a time travel entity");
    }

    this.core.makeTransaction(
      [
        {
          op: "set",
          key,
          value: isCoValue(value) ? value.id : value,
        },
      ],
      privacy,
    );

    this.revalidateTransactions();
  }

  /** Delete the given key (setting it to undefined).
   *
   * If `privacy` is `"private"` **(default)**, `key` is encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.
   *
   * If `privacy` is `"trusting"`, `key` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.
   *
   * @category 2. Editing
   **/
  delete(
    key: keyof Shape & string,
    privacy: "private" | "trusting" = "private",
  ) {
    if (this.isTimeTravelEntity()) {
      throw new Error("Cannot delete value on a time travel entity");
    }

    this.core.makeTransaction(
      [
        {
          op: "del",
          key,
        },
      ],
      privacy,
    );

    this.revalidateTransactions();
  }
}

export function operationToEditEntry<
  K extends string,
  V extends JsonValue | undefined,
>(op: MapOp<K, V>) {
  return {
    by: accountOrAgentIDfromSessionID(op.txID.sessionID),
    tx: op.txID,
    at: new Date(op.madeAt),
    value: op.change.op === "del" ? undefined : op.change.value,
  };
}
