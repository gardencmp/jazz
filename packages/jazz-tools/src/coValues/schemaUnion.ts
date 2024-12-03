import {
  CoValue,
  CoValueBase,
  CoValueClass,
  CoValueFromRaw,
} from "../internal.js";

/**
 * SchemaUnion allows you to create union types of CoValues that can be discriminated at runtime.
 *
 * @categoryDescription Declaration
 * Declare your union types by extending `SchemaUnion.Of(...)` and passing a discriminator function that determines which concrete type to use based on the raw data.
 *
 * ```ts
 * import { SchemaUnion, CoMap } from "jazz-tools";
 *
 * class BaseWidget extends CoMap {
 *   type = co.string;
 * }
 *
 * class ButtonWidget extends BaseWidget {
 *   type = co.literal("button");
 *   label = co.string;
 * }
 *
 * class SliderWidget extends BaseWidget {
 *   type = co.literal("slider");
 *   min = co.number;
 *   max = co.number;
 * }
 *
 * const WidgetUnion = SchemaUnion.Of<BaseWidget>((raw) => {
 *   switch (raw.get("type")) {
 *     case "button": return ButtonWidget;
 *     case "slider": return SliderWidget;
 *     default: throw new Error("Unknown widget type");
 *   }
 * });
 * ```
 *
 * @category CoValues
 */
export abstract class SchemaUnion extends CoValueBase implements CoValue {
  /**
   * Create a new union type from a discriminator function.
   *
   * The discriminator function receives the raw data and should return the appropriate concrete class to use for that data.
   *
   * When loading a SchemaUnion, the correct subclass will be instantiated based on the discriminator.
   *
   * @param discriminator - Function that determines which concrete type to use
   * @returns A new class that can create/load instances of the union type
   *
   * @example
   * ```ts
   * const WidgetUnion = SchemaUnion.Of<BaseWidget>((raw) => {
   *   switch (raw.get("type")) {
   *     case "button": return ButtonWidget;
   *     case "slider": return SliderWidget;
   *     default: throw new Error("Unknown widget type");
   *   }
   * });
   *
   * const widget = await loadCoValue(WidgetUnion, id, me, {});
   *
   * // You can narrow the returned instance to a subclass by using `instanceof`
   * if (widget instanceof ButtonWidget) {
   *   console.log(widget.label);
   * } else if (widget instanceof SliderWidget) {
   *   console.log(widget.min, widget.max);
   * }
   * ```
   *
   * @category Declaration
   **/
  static Of<V extends CoValue>(
    discriminator: (raw: V["_raw"]) => CoValueClass<V> & CoValueFromRaw<V>,
  ): CoValueClass<V> & typeof SchemaUnion {
    return class SchemaUnionClass extends SchemaUnion {
      static override fromRaw<T extends CoValue>(
        this: CoValueClass<T> & CoValueFromRaw<T>,
        raw: T["_raw"],
      ): T {
        const ResolvedClass = discriminator(
          raw as V["_raw"],
        ) as unknown as CoValueClass<T> & CoValueFromRaw<T>;
        return ResolvedClass.fromRaw(raw);
      }
    } as unknown as CoValueClass<V> & typeof SchemaUnion;
  }

  /**
   * Create an instance from raw data. This is called internally and should not be used directly.
   * Use {@link SchemaUnion.Of} to create a union type instead.
   *
   * @internal
   */
  // @ts-ignore
  static fromRaw<V extends CoValue>(this: CoValueClass<V>, raw: V["_raw"]): V {
    throw new Error("Not implemented");
  }
}
