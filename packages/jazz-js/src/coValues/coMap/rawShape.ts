import { RawType } from "../../baseInterfaces.js";
import { Schema } from "../../schema.js";
import { BaseCoMapShape } from "./coMap.js";

export type RawShape<Shape extends BaseCoMapShape> = {
    [Key in Exclude<keyof Shape, '...'>]: RawType<Shape[Key]>;
} & {
    [Key in Shape['...'] extends Schema ? string : never]: RawType<Shape[keyof Shape]>;
}