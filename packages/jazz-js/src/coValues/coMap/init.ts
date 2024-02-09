import { BaseCoMapShape } from "./coMap.js";

type CoMapInitBase<Shape extends BaseCoMapShape> = {
    [Key in keyof Shape as null extends Shape[Key]["_Value"] ? never : Key]: Shape[Key]["_Value"];
} & {
        [Key in keyof Shape as null extends Shape[Key]["_Value"] ? Key : never]?: Shape[Key]["_Value"] |
        null |
        undefined;
    };

export type CoMapInit<Shape extends BaseCoMapShape> = Record<
    string, never
> extends CoMapInitBase<Shape> ? CoMapInitBase<Shape> | undefined : CoMapInitBase<Shape>;
