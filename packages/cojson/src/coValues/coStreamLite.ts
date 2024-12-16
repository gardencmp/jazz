import { CoID } from "../coValue.js";

import { RawCoValue } from "../coValue.js";
import { CoValueCore } from "../coValueCore.js";
import { JsonObject, JsonValue } from "../jsonValue.js";
import { CoValueKnownState } from "../sync.js";
import { isCoValue } from "../typeUtils/isCoValue.js";
import { CoStreamItem } from "./coStream.js";
import { RawGroup } from "./group.js";

export class RawCoStreamLiteView<
  Item extends JsonValue = JsonValue,
  Meta extends JsonObject | null = JsonObject | null,
> implements RawCoValue
{
  id: CoID<this>;
  type = "costream" as const;
  core: CoValueCore;
  items: CoStreamItem<Item>[];
  knownTransactions: CoValueKnownState["sessions"];
  readonly _item!: Item;

  constructor(core: CoValueCore) {
    this.id = core.id as CoID<this>;
    this.core = core;
    this.items = [];
    this.knownTransactions = {};

    this.processNewTransactions();
  }

  /** @category 6. Meta */
  get headerMeta(): Meta {
    return this.core.header.meta as Meta;
  }

  /** @category 6. Meta */
  get group(): RawGroup {
    return this.core.getGroup();
  }

  /** Returns an immutable JSON presentation of this `CoValue` */
  toJSON() {
    return this.items;
  }

  /** Not yet implemented */
  atTime(_time: number): this {
    throw new Error("Not yet implemented");
  }

  /** @internal */
  protected processNewTransactions() {
    const { items } = this;

    for (const { txID, madeAt, changes } of this.core.getValidTransactions({
      ignorePrivateTransactions: false,
      knownTransactions: this.knownTransactions,
    })) {
      for (const changeUntyped of changes) {
        const change = changeUntyped as Item;
        items.push({ value: change, madeAt, tx: txID });
      }

      this.knownTransactions[txID.sessionID] = Math.max(
        this.knownTransactions[txID.sessionID] ?? 0,
        txID.txIndex,
      );
    }
  }

  subscribe(listener: (coStream: this) => void): () => void {
    return this.core.subscribe((content) => {
      listener(content as this);
    });
  }
}

export class RawCoStreamLite<
    Item extends JsonValue = JsonValue,
    Meta extends JsonObject | null = JsonObject | null,
  >
  extends RawCoStreamLiteView<Item, Meta>
  implements RawCoValue
{
  push(item: Item, privacy: "private" | "trusting" = "private"): void {
    this.core.makeTransaction([isCoValue(item) ? item.id : item], privacy);
    this.processNewTransactions();
  }

  pushItems(items: Item[], privacy: "private" | "trusting" = "private"): void {
    this.core.makeTransaction(
      items.map((item) => (isCoValue(item) ? item.id : item)),
      privacy,
    );
    this.processNewTransactions();
  }
}
