import { DraftIndicator } from "./DraftIndicator.tsx";
import { OrderThumbnail } from "./OrderThumbnail.tsx";
import { useAccount } from "./main.tsx";

export function Orders() {
  const { me } = useAccount({
    root: { orders: [] },
  });

  return (
    <>
      <section className="space-y-5">
        <a
          href={`/#/order`}
          className="block relative p-3 bg-white border text-center rounded-md dark:bg-stone-900"
        >
          <strong>Add new order</strong>
          <DraftIndicator />
        </a>

        <div className="space-y-3">
          <h1 className="text-lg pb-2 border-b mb-3">
            <strong>Your orders 🧋</strong>
          </h1>

          {me?.root?.orders?.length ? (
            me?.root?.orders.map((order) =>
              order ? <OrderThumbnail key={order.id} order={order} /> : null,
            )
          ) : (
            <p>You have no orders yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
