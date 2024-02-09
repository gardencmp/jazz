import { RawType } from "../../baseInterfaces.js";
import { BaseCoMapShape } from "./coMap.js";

export type RawShape<Shape extends BaseCoMapShape> = {
    [Key in keyof Shape]: RawType<Shape[Key]>;
};
