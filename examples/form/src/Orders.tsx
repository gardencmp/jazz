import { OrderThumbnail } from "./OrderThumbnail.tsx";
import { useAccount } from "./main.tsx";

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
          <h1 className="font-semibold text-lg dark:text-white pb-2 border-b mb-3">
            Your orders 🧋
          </h1>
          {me?.profile?.orders.map((order) =>
            order ? <OrderThumbnail key={order.id} order={order} /> : null,
          )}
        </div>
      </section>
    </>
  );
}
