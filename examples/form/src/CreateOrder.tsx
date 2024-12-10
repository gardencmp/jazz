import { CoMapInit } from "jazz-tools";
import { SubmitHandler, useForm } from "react-hook-form";
import { useAccount } from "./main.tsx";
import {
  BubbleTeaAddOnTypes,
  BubbleTeaBaseTeaTypes,
  BubbleTeaOrder,
} from "./schema.ts";

interface BubbleTeaOrderType {
  baseTea: (typeof BubbleTeaBaseTeaTypes)[number];
  addOns: Array<(typeof BubbleTeaAddOnTypes)[number]>;
  deliveryDate: Date;
  withMilk: boolean;
  instructions?: string;
}

export function CreateOrder() {
  const { me } = useAccount({
    profile: { orders: [] },
  });
  const { register, handleSubmit } = useForm<BubbleTeaOrderType>();

  const onSubmit: SubmitHandler<BubbleTeaOrderType> = (data) => {
    if (me?.profile) {
      const order = BubbleTeaOrder.create(
        {
          ...(data as CoMapInit<BubbleTeaOrder>),
          deliveryDate: new Date(data.deliveryDate),
        },
        { owner: me.profile._owner },
      );

      console.log("order created", data);

      me.profile.orders.push(order);
    }
  };

  return (
    <>
      <section>
        <h1>Order a bubble tea 🧋</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="baseTea">Base tea</label>
            <select {...register("baseTea")}>
              {BubbleTeaBaseTeaTypes.map((teaType) => (
                <option key={teaType} value={teaType}>
                  {teaType}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend>Add-ons</legend>

            {BubbleTeaAddOnTypes.map((addOn) => (
              <div key={addOn}>
                <label>
                  <input
                    type="checkbox"
                    value={addOn}
                    {...register("addOns")}
                  />
                  {addOn}
                </label>
              </div>
            ))}
          </fieldset>

          <div>
            <label htmlFor="deliveryDate">Delivery date</label>
            <input type="date" {...register("deliveryDate")} required />
          </div>

          <div>
            <label htmlFor="withMilk">With milk?</label>
            <input type="checkbox" {...register("withMilk")} />
          </div>

          <div>
            <label htmlFor="instructions">Special instructions</label>
            <textarea {...register("instructions")}></textarea>
          </div>

          <div>
            <button type="submit" className="bg-black">
              Submit
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
