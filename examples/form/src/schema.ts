import { Account, CoList, CoMap, Profile, co } from "jazz-tools";

export const BubbleTeaAddOnTypes = [
  "pearl",
  "lychee jelly",
  "red bean",
  "brown sugar",
  "taro",
] as const;

export const BubbleTeaTypes = ["black", "oolong", "jasmine", "thai"] as const;

export class BubbleTeaAddOns extends CoList.Of(
  co.literal(...BubbleTeaAddOnTypes),
) {}

export class BubbleTeaOrder extends CoMap {
  baseTea = co.literal(...BubbleTeaTypes);
  addOns = co.ref(BubbleTeaAddOns);
  deliveryDate = co.Date;
  withMilk = co.boolean;
  instructions = co.optional.string;
}

export class BubbleTeaOrders extends CoList.Of(BubbleTeaOrder) {}

/** The profile is an app-specific per-user public `CoMap`
 *  where you can store top-level objects for that user */
export class JazzProfile extends Profile {
  orders = co.ref(BubbleTeaOrders);
}

export class JazzAccount extends Account {
  profile = co.ref(JazzProfile);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  migrate(this: JazzAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);
  }
}
