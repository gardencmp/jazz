import { useAccount } from "./main.tsx";
import { BubbleTeaOrder } from "./schema.ts";

function Order({ order }: { order: BubbleTeaOrder }) {
  return (
    <a href={`/#/order/${order.id}`}>
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
      <section>
        <h1>Your orders 🧋</h1>

        {me?.profile?.orders.map((order) =>
          order ? <Order key={order.id} order={order} /> : null,
        )}
      </section>
    </>
  );
}
