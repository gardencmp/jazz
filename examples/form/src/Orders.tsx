import { DraftIndicator } from "./DraftIndicator.tsx";
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
          className="block relative p-3 bg-white font-semibold text-black border text-center text-white rounded-md dark:border-white"
        >
          Add new order
          <DraftIndicator />
        </a>

        <div className="space-y-3">
          <h1 className="font-semibold text-lg text-stone-900 dark:text-white pb-2 border-b mb-3">
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
