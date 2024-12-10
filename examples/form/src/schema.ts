import { Account, CoList, CoMap, Profile, co } from "jazz-tools";

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

export class BubbleTeaAddOns extends CoList.Of(
  co.literal(...BubbleTeaAddOnTypes),
) {}

export class BubbleTeaOrder extends CoMap {
  baseTea = co.literal(...BubbleTeaBaseTeaTypes);
  addOns = co.ref(BubbleTeaAddOns);
  deliveryDate = co.Date;
  withMilk = co.boolean;
  instructions = co.optional.string;
}
export class ListOfBubbleTeaOrders extends CoList.Of(co.ref(BubbleTeaOrder)) {}

/** The profile is an app-specific per-user public `CoMap`
 *  where you can store top-level objects for that user */
export class JazzProfile extends Profile {
  orders = co.ref(ListOfBubbleTeaOrders);
}

export class JazzAccount extends Account {
  profile = co.ref(JazzProfile)!;

  migrate(this: JazzAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);

    if (!this.profile._refs.orders) {
      this.profile.orders = ListOfBubbleTeaOrders.create([], {
        owner: this.profile._owner,
      });
    }
  }
}