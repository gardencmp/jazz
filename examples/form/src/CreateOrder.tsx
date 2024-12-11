import { ID } from "jazz-tools";
import { OrderForm } from "./OrderForm.tsx";
import { useAccount, useCoState } from "./main.tsx";
import {
  BubbleTeaAddOnTypes,
  BubbleTeaBaseTeaTypes,
  DraftBubbleTeaOrder,
} from "./schema.ts";

export interface BubbleTeaOrderType {
  baseTea: (typeof BubbleTeaBaseTeaTypes)[number];
  addOns: Array<(typeof BubbleTeaAddOnTypes)[number]>;
  deliveryDate: Date;
  withMilk: boolean;
  instructions?: string;
}

export function CreateOrder() {
  const { me } = useAccount({ profile: { draft: {} } });

  if (!me?.profile) return;

  return <CreateOrderForm id={me?.profile?.draft.id} />;
}

function CreateOrderForm({ id }: { id: ID<DraftBubbleTeaOrder> }) {
  const draft = useCoState(DraftBubbleTeaOrder, id);

  if (!draft) return;

  const addOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return <OrderForm order={draft} onSave={addOrder} />;
}
