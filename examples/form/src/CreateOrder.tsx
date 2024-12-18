import { useIframeHashRouter } from "hash-slash";
import { ID } from "jazz-tools";
import { useState } from "react";
import { Errors } from "./Errors.tsx";
import { LinkToHome } from "./LinkToHome.tsx";
import { OrderForm } from "./OrderForm.tsx";
import { useAccount, useCoState } from "./main.tsx";
import {
  BubbleTeaOrder,
  DraftBubbleTeaOrder,
  ListOfBubbleTeaAddOns,
} from "./schema.ts";

export function CreateOrder() {
  const { me } = useAccount({
    resolve: { profile: { draft: true, orders: true } },
  });
  const router = useIframeHashRouter();
  const [errors, setErrors] = useState<string[]>([]);

  if (!me?.profile) return;

  const onSave = (draft: DraftBubbleTeaOrder) => {
    // validate if the draft is a valid order
    const validation = draft.validate();
    setErrors(validation.errors);
    if (validation.errors.length > 0) {
      return;
    }

    // turn the draft into a real order
    me.profile.orders.push(draft as BubbleTeaOrder);

    // reset the draft
    me.profile.draft = DraftBubbleTeaOrder.create(
      {
        addOns: ListOfBubbleTeaAddOns.create([], { owner: me.profile._owner }),
      },
      { owner: me.profile._owner },
    );

    router.navigate("/");
  };

  return (
    <>
      <LinkToHome />

      <h1 className="text-lg">
        <strong>Make a new bubble tea order 🧋</strong>
      </h1>

      <Errors errors={errors} />

      <CreateOrderForm id={me?.profile?.draft.id} onSave={onSave} />
    </>
  );
}

function CreateOrderForm({
  id,
  onSave,
}: {
  id: ID<DraftBubbleTeaOrder>;
  onSave: (draft: DraftBubbleTeaOrder) => void;
}) {
  const draft = useCoState(DraftBubbleTeaOrder, id, {
    resolve: { addOns: true },
  });

  if (!draft) return;

  const addOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(draft);
  };

  return <OrderForm order={draft} onSave={addOrder} />;
}
