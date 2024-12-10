import {
  BubbleTeaAddOnTypes,
  BubbleTeaBaseTeaTypes,
  BubbleTeaOrder,
} from "./schema.ts";

export function OrderForm({
  order,
  onSubmit,
}: {
  order: BubbleTeaOrder;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div>
        <label htmlFor="baseTea">Base tea</label>
        <select
          name="baseTea"
          id="baseTea"
          value={order.baseTea}
          onChange={(e) => (order.baseTea = e.target.value as any)}
        >
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
              <input type="checkbox" value={addOn} name="addOns" id="addOns" />
              {addOn}
            </label>
          </div>
        ))}
      </fieldset>

      <div>
        <label htmlFor="deliveryDate">Delivery date</label>
        <input
          type="date"
          name="deliveryDate"
          id="deliveryDate"
          value={order.deliveryDate?.toISOString().split("T")[0]}
          onChange={(e) => (order.deliveryDate = new Date(e.target.value))}
          required
        />
      </div>

      <div>
        <label htmlFor="withMilk">With milk?</label>
        <input
          type="checkbox"
          name="withMilk"
          id="withMilk"
          checked={order.withMilk}
          onChange={(e) => (order.withMilk = e.target.checked)}
        />
      </div>

      <div>
        <label htmlFor="instructions">Special instructions</label>
        <textarea
          name="instructions"
          id="instructions"
          value={order.instructions}
          onChange={(e) => (order.instructions = e.target.value)}
        ></textarea>
      </div>

      {onSubmit && (
        <button type="submit" className="bg-black">
          Submit
        </button>
      )}
    </form>
  );
}
