import { OrderForm } from "./OrderForm.tsx";
import { useAccount } from "./main.tsx";
import {
  BubbleTeaAddOnTypes,
  BubbleTeaBaseTeaTypes,
  BubbleTeaOrder,
  ListOfBubbleTeaAddOns,
} from "./schema.ts";

export interface BubbleTeaOrderType {
  baseTea: (typeof BubbleTeaBaseTeaTypes)[number];
  addOns: Array<(typeof BubbleTeaAddOnTypes)[number]>;
  deliveryDate: Date;
  withMilk: boolean;
  instructions?: string;
}

export function CreateOrder() {
  const { me } = useAccount({
    profile: { orders: [] },
  });

  if (!me?.profile) return;

  const newOrder = BubbleTeaOrder.create(
    {
      baseTea: BubbleTeaBaseTeaTypes[0],
      addOns: ListOfBubbleTeaAddOns.create([], { owner: me.profile._owner }),
      deliveryDate: new Date(),
      withMilk: false,
    },
    { owner: me?.profile._owner },
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (me?.profile) {
      me.profile.orders.push(newOrder);
    }
  };

  return (
    <>
      <section>
        <h1>Order a bubble tea 🧋</h1>

        <OrderForm order={newOrder} onSubmit={onSubmit} />
      </section>
    </>
  );
}
