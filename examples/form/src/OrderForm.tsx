import {
  BubbleTeaAddOnTypes,
  BubbleTeaBaseTeaTypes,
  BubbleTeaOrder,
  DraftBubbleTeaOrder,
} from "./schema.ts";

export function OrderForm({
  order,
  onSave,
}: {
  order: BubbleTeaOrder | DraftBubbleTeaOrder;
  onSave?: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSave} className="grid gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="baseTea">Base tea</label>
        <select
          name="baseTea"
          id="baseTea"
          value={order.baseTea || ""}
          className="dark:bg-transparent"
          onChange={(e) => (order.baseTea = e.target.value as any)}
          required
        >
          <option value="" disabled>
            Please select your preferred base tea
          </option>
          {BubbleTeaBaseTeaTypes.map((teaType) => (
            <option key={teaType} value={teaType}>
              {teaType}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-2">Add-ons</legend>

        {BubbleTeaAddOnTypes.map((addOn) => (
          <div key={addOn} className="flex items-center gap-2">
            <input
              type="checkbox"
              value={addOn}
              name={addOn}
              id={addOn}
              checked={order.addOns?.includes(addOn) || false}
              onChange={(e) => {
                if (e.target.checked) {
                  order.addOns?.push(addOn);
                } else {
                  order.addOns?.splice(order.addOns?.indexOf(addOn), 1);
                }
              }}
            />
            <label htmlFor={addOn}>{addOn}</label>
          </div>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="deliveryDate">Delivery date</label>
        <input
          type="date"
          name="deliveryDate"
          id="deliveryDate"
          className="dark:bg-transparent"
          value={order.deliveryDate?.toISOString().split("T")[0] || ""}
          onChange={(e) => (order.deliveryDate = new Date(e.target.value))}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="withMilk"
          id="withMilk"
          checked={order.withMilk}
          onChange={(e) => (order.withMilk = e.target.checked)}
        />
        <label htmlFor="withMilk">With milk?</label>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="instructions">Special instructions</label>
        <textarea
          name="instructions"
          id="instructions"
          value={order.instructions}
          className="dark:bg-transparent"
          onChange={(e) => (order.instructions = e.target.value)}
        ></textarea>
      </div>

      {onSave && (
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Submit
        </button>
      )}
    </form>
  );
}
