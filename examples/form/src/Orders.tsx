import { useAccount } from "./main.tsx";
import { BubbleTeaOrder, DraftBubbleTeaOrder } from "./schema.ts";

function Order({ order }: { order: BubbleTeaOrder | DraftBubbleTeaOrder }) {
  return (
    <a href={`/#/order/${order.id}`} className="border p-3 block">
      <div>{order.id}</div>
      <div>{order.baseTea}</div>
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
