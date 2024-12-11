import { ID } from "jazz-tools";
import { OrderForm } from "./OrderForm.tsx";
import { useAccount, useCoState } from "./main.tsx";
import { BubbleTeaOrder, DraftBubbleTeaOrder } from "./schema.ts";

export function CreateOrder() {
  const { me } = useAccount({ profile: { draft: {}, orders: [] } });

  if (!me?.profile) return;

  const onSave = (draft: DraftBubbleTeaOrder) => {
    // turn the draft into a real order
    me.profile.orders.push(draft as BubbleTeaOrder);

    // reset the draft
    me.profile.draft = DraftBubbleTeaOrder.create(
      {},
      { owner: me.profile._owner },
    );
  };

  return <CreateOrderForm id={me?.profile?.draft.id} onSave={onSave} />;
}

function CreateOrderForm({
  id,
  onSave,
}: {
  id: ID<DraftBubbleTeaOrder>;
  onSave: (draft: DraftBubbleTeaOrder) => void;
}) {
  const draft = useCoState(DraftBubbleTeaOrder, id);

  if (!draft) return;

  const addOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(draft);
  };

  return <OrderForm order={draft} onSave={addOrder} />;
}
