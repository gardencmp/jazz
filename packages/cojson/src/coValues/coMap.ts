import { CoID, RawCoValue } from "../coValue.js";
import { CoValueCore, DecryptedTransaction } from "../coValueCore.js";
import { AgentID, TransactionID } from "../ids.js";
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
  cachedOps?: {
    [Key in keyof Shape & string]?: MapOp<Key, Shape[Key]>[];
  };
  /** @internal */
  validSortedTransactions?: DecryptedTransaction[];

  /** @internal */
  options?: { ignorePrivateTransactions: boolean; atTime?: number };
  /** @internal */
  atTimeFilter?: number = undefined;
  /** @category 6. Meta */
  readonly _shape!: Shape;

  /** @internal */
  constructor(
    core: CoValueCore,
    options?: {
      ignorePrivateTransactions: boolean;
      atTime?: number;
      validSortedTransactions?: DecryptedTransaction[];
      cachedOps?: {
        [Key in keyof Shape & string]?: MapOp<Key, Shape[Key]>[];
      };
    },
  ) {
    this.id = core.id as CoID<this>;
    this.core = core;
    this.latest = {};
    this.latestTxMadeAt = 0;
    this.options = options;
    this.cachedOps = options?.cachedOps;
    this.validSortedTransactions = options?.validSortedTransactions;

    this.processLatestTransactions();
  }

  /** @internal */
  private getValidSortedTransactions() {
    if (this.validSortedTransactions) {
      return this.validSortedTransactions;
    }

    const validSortedTransactions = this.core.getValidSortedTransactions({
      ignorePrivateTransactions:
        this.options?.ignorePrivateTransactions ?? false,
    });

    this.validSortedTransactions = validSortedTransactions;

    return validSortedTransactions;
  }

  private resetCachedValues() {
    this.validSortedTransactions = undefined;
    this.cachedOps = undefined;
  }

  private processLatestTransactions() {
    // Reset all internal state and cached values
    this.latest = {};
    this.latestTxMadeAt = 0;

    const { latest } = this;

    const atTimeFilter = this.options?.atTime;

    for (const { txID, changes, madeAt } of this.getValidSortedTransactions()) {
      if (atTimeFilter && madeAt > atTimeFilter) {
        continue;
      }

      if (madeAt > this.latestTxMadeAt) {
        this.latestTxMadeAt = madeAt;
      }

      for (let changeIdx = 0; changeIdx < changes.length; changeIdx++) {
        const change = changes[changeIdx] as MapOpPayload<
          keyof Shape & string,
          Shape[keyof Shape & string]
        >;
        let entry = latest[change.key];
        if (!entry) {
          entry = {
            txID,
            madeAt,
            changeIdx,
            change,
          };
          latest[change.key] = entry;
        } else if (madeAt >= entry.madeAt) {
          entry.txID = txID;
          entry.madeAt = madeAt;
          entry.changeIdx = changeIdx;
          entry.change = change;
        }
      }
    }
  }

  revalidateTransactions() {
    this.resetCachedValues();
    this.processLatestTransactions();
  }

  private getOps() {
    if (this.cachedOps) {
      return this.cachedOps;
    }

    const ops: {
      [Key in keyof Shape & string]?: MapOp<Key, Shape[Key]>[];
    } = {};

    for (const { txID, changes, madeAt } of this.getValidSortedTransactions()) {
      for (let changeIdx = 0; changeIdx < changes.length; changeIdx++) {
        const change = changes[changeIdx] as MapOpPayload<
          keyof Shape & string,
          Shape[keyof Shape & string]
        >;
        let entries = ops[change.key];
        if (!entries) {
          entries = [];
          ops[change.key] = entries;
        }
        entries.push({
          txID,
          madeAt,
          changeIdx,
          change,
        });
      }
    }

    this.cachedOps = ops;

    return ops;
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
      const clone = new RawCoMapView(this.core, {
        ignorePrivateTransactions:
          this.options?.ignorePrivateTransactions ?? false,
        atTime: time,
        cachedOps: this.cachedOps,
        validSortedTransactions: this.validSortedTransactions,
      });
      Object.setPrototypeOf(clone, this);
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

    const atTimeFilter = this.options?.atTime;

    if (atTimeFilter) {
      return this.getOps()[key]?.filter((op) => op.madeAt <= atTimeFilter);
    } else {
      return this.getOps()[key];
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
    const ops = this.getOps()[key];

    const atTimeFilter = this.options?.atTime;
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
