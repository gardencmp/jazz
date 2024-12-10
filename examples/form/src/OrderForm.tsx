import { ID } from "jazz-tools";
import { BubbleTeaOrder } from "./schema.ts";

export function OrderForm({ id }: { id?: ID<BubbleTeaOrder> }) {
  const isEdit = !!id;

  return (
    <>
      <section>
        <h1>
          🧋 {isEdit ? "Edit your bubble tea order" : "Order a bubble tea"}
        </h1>
      </section>
    </>
  );
}
