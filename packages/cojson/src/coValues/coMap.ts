import { CoID, RawCoValue } from "../coValue.js";
import { CoValueCore } from "../coValueCore.js";
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
  options?: { ignorePrivateTransactions: boolean; atTime?: number };
  /** @internal */
  atTimeFilter?: number = undefined;
  /** @category 6. Meta */
  readonly _shape!: Shape;

  /** @internal */
  constructor(
    core: CoValueCore,
    options?: { ignorePrivateTransactions: boolean; atTime?: number },
  ) {
    this.id = core.id as CoID<this>;
    this.core = core;
    this.latest = {};
    this.latestTxMadeAt = 0;
    this.options = options;

    this.processLatestTransactions();
  }

  processLatestTransactions() {
    this.latest = {};
    this.latestTxMadeAt = 0;

    const { core, options, latest } = this;

    for (const { txID, changes, madeAt } of core.getValidSortedTransactions({
      ignorePrivateTransactions: options?.ignorePrivateTransactions ?? false,
    })) {
      if (options?.atTime && madeAt > options.atTime) {
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

  private getOps() {
    if (this.cachedOps) {
      return this.cachedOps;
    }

    const ops: {
      [Key in keyof Shape & string]?: MapOp<Key, Shape[Key]>[];
    } = {};

    for (const {
      txID,
      changes,
      madeAt,
    } of this.core.getValidSortedTransactions(this.options)) {
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

    if (this.atTimeFilter) {
      return this.getOps()[key]?.filter(
        (op) => op.madeAt <= this.atTimeFilter!,
      );
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
      const latest = this.latest[key];
      if (!latest) {
        return undefined;
      }

      const includeUntil = this.atTimeFilter;
      const lastEntry = includeUntil
        ? this.getOps()[key]?.findLast((entry) => entry.madeAt <= includeUntil)
        : latest!;

      if (lastEntry?.change.op === "del") {
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
    const latest = this.latest[key];
    if (!latest) {
      return undefined;
    }

    const includeUntil = this.atTimeFilter;
    const lastEntry = includeUntil
      ? this.timeFilteredOps(key)?.findLast(
          (entry) => entry.madeAt <= includeUntil,
        )
      : latest;

    if (lastEntry?.change.op === "del") {
      return undefined;
    } else {
      return lastEntry?.change.value;
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
    n: number,
  ):
    | {
        by: RawAccountID | AgentID;
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
      value: entry.change.op === "del" ? undefined : entry.change.value,
    };
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

    this.processLatestTransactions();
    this.cachedOps = undefined;
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

    this.processLatestTransactions();
    this.cachedOps = undefined;
  }
}
