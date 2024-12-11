import { useAccount } from "./main.tsx";
import { BubbleTeaOrder } from "./schema.ts";

function Order({ order }: { order: BubbleTeaOrder }) {
  const { id, baseTea, addOns, deliveryDate, withMilk, instructions } = order;
  const date = deliveryDate.toLocaleDateString();

  return (
    <a
      href={`/#/order/${id}`}
      className="border p-3 flex justify-between items-start gap-3"
    >
      <div>
        <div className="font-medium">
          {baseTea} {withMilk ? "milk " : ""} tea
        </div>
        {addOns && addOns?.length > 0 && (
          <div className="text-sm text-stone-600">
            with {addOns?.join(", ").toLowerCase()}
          </div>
        )}
      </div>
      <div className="text-sm text-stone-600">{date}</div>
    </a>
  );
}

export function Orders() {
  const { me } = useAccount({
    profile: { orders: [] },
  });

  return (
    <>
      <section className="space-y-5">
        <a
          href={`/#/order`}
          className="block p-3 bg-blue-500 text-center text-white rounded-md"
        >
          Add new order
        </a>

        <div className="space-y-3">
          <h1 className="font-semibold pb-2 border-b mb-3">Your orders 🧋</h1>
          {me?.profile?.orders.map((order) =>
            order ? <Order key={order.id} order={order} /> : null,
          )}
        </div>
      </section>
    </>
  );
}
