import { Account, CoList, CoMap, co } from "jazz-tools";

export const BubbleTeaAddOnTypes = [
  "Pearl",
  "Lychee jelly",
  "Red bean",
  "Brown sugar",
  "Taro",
] as const;

export const BubbleTeaBaseTeaTypes = [
  "Black",
  "Oolong",
  "Jasmine",
  "Thai",
] as const;

export class ListOfBubbleTeaAddOns extends CoList.Of(
  co.literal(...BubbleTeaAddOnTypes),
) {
  get hasChanges() {
    return Object.entries(this._raw.insertions).length > 0;
  }
}

export class BubbleTeaOrder extends CoMap {
  baseTea = co.literal(...BubbleTeaBaseTeaTypes);
  addOns = co.ref(ListOfBubbleTeaAddOns);
  deliveryDate = co.Date;
  withMilk = co.boolean;
  instructions = co.optional.string;
}

export class DraftBubbleTeaOrder extends CoMap {
  baseTea = co.optional.literal(...BubbleTeaBaseTeaTypes);
  addOns = co.optional.ref(ListOfBubbleTeaAddOns);
  deliveryDate = co.optional.Date;
  withMilk = co.optional.boolean;
  instructions = co.optional.string;

  get hasChanges() {
    return Object.keys(this._edits).length > 1 || this.addOns?.hasChanges;
  }

  // validate if the draft is a valid order
  validate() {
    const errors: string[] = [];

    if (!this.baseTea) {
      errors.push("Please select your preferred base tea.");
    }
    if (!this.deliveryDate) {
      errors.push("Plese select a delivery date.");
    }

    return { errors };
  }
}

export class ListOfBubbleTeaOrders extends CoList.Of(co.ref(BubbleTeaOrder)) {}

/** The root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class AccountRoot extends CoMap {
  draft = co.ref(DraftBubbleTeaOrder);
  orders = co.ref(ListOfBubbleTeaOrders);
}

export class JazzAccount extends Account {
  root = co.ref(AccountRoot);

  migrate(this: JazzAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);

    if (!this._refs.root) {
      const ownership = { owner: this };
      const orders = ListOfBubbleTeaOrders.create([], ownership);
      const draft = DraftBubbleTeaOrder.create(
        {
          addOns: ListOfBubbleTeaAddOns.create([], ownership),
        },
        ownership,
      );

      this.root = AccountRoot.create({ draft, orders }, ownership);
    }
  }
}
