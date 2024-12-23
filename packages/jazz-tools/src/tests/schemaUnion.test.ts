import { WasmCrypto } from "cojson";
import { beforeAll, describe, expect, expectTypeOf, it } from "vitest";
import { SchemaUnion } from "../coValues/schemaUnion.js";
import {
  Account,
  CoMap,
  co,
  loadCoValue,
  subscribeToCoValue,
} from "../exports.js";

class BaseWidget extends CoMap {
  type = co.string;
}

class ButtonWidget extends BaseWidget {
  type = co.literal("button");
  label = co.string;
}

class SliderWidget extends BaseWidget {
  type = co.literal("slider");
  min = co.number;
  max = co.number;
}

class CheckboxWidget extends BaseWidget {
  type = co.literal("checkbox");
  checked = co.boolean;
}

const getWidgetSchemaFromRaw = (raw: BaseWidget["_raw"]) => {
  switch (raw.get("type")) {
    case "button":
      return ButtonWidget;
    case "slider":
      return SliderWidget;
    case "checkbox":
      return CheckboxWidget;
    default:
      throw new Error(`Unknown widget type: ${raw.get("type")}`);
  }
};

class WidgetUnion extends SchemaUnion.Of<BaseWidget>(getWidgetSchemaFromRaw) {}

describe("SchemaUnion", () => {
  let Crypto: WasmCrypto;
  let me: Account;

  beforeAll(async () => {
    Crypto = await WasmCrypto.create();
    me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });
  });

  it("should instantiate the correct subclass based on schema and provided data", async () => {
    const buttonWidget = ButtonWidget.create(
      { type: "button", label: "Submit" },
      { owner: me },
    );
    const sliderWidget = SliderWidget.create(
      { type: "slider", min: 0, max: 100 },
      { owner: me },
    );
    const checkboxWidget = CheckboxWidget.create(
      { type: "checkbox", checked: true },
      { owner: me },
    );

    const loadedButtonWidget = await loadCoValue(
      WidgetUnion,
      buttonWidget.id,
      me,
      {},
    );
    const loadedSliderWidget = await loadCoValue(
      WidgetUnion,
      sliderWidget.id,
      me,
      {},
    );
    const loadedCheckboxWidget = await loadCoValue(
      WidgetUnion,
      checkboxWidget.id,
      me,
      {},
    );

    expect(loadedButtonWidget).toBeInstanceOf(ButtonWidget);
    expect(loadedSliderWidget).toBeInstanceOf(SliderWidget);
    expect(loadedCheckboxWidget).toBeInstanceOf(CheckboxWidget);
  });

  it("should integrate with subscribeToCoValue correctly", async () => {
    const buttonWidget = ButtonWidget.create(
      { type: "button", label: "Submit" },
      { owner: me },
    );
    const unsubscribe = subscribeToCoValue(
      WidgetUnion,
      buttonWidget.id,
      me,
      {},
      (value: BaseWidget) => {
        if (value instanceof ButtonWidget) {
          expect(value.label).toBe("Changed");
          unsubscribe();
        } else {
          throw new Error("Unexpected widget type");
        }
      },
    );
    buttonWidget.label = "Changed";
  });
});
