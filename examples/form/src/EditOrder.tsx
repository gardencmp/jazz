import { ID } from "jazz-tools";
import { LinkToHome } from "./LinkToHome.tsx";
import { OrderForm } from "./OrderForm.tsx";
import { OrderThumbnail } from "./OrderThumbnail.tsx";
import { useCoState } from "./main.tsx";
import { BubbleTeaOrder } from "./schema.ts";

export function EditOrder(props: { id: ID<BubbleTeaOrder> }) {
  const order = useCoState(BubbleTeaOrder, props.id, []);

  if (!order) return;

  return (
    <>
      <LinkToHome />

      <OrderThumbnail order={order} />

      <h1 className="font-semibold text-lg dark:text-white">
        Edit your bubble tea order 🧋
      </h1>

      <OrderForm order={order} />
    </>
  );
}
