import { CoValue } from "../../index.js";
import { ValueRef } from "../../valueRef.js";
import { BaseCoMapShape } from "./coMap.js";


export type RefsShape<Shape extends BaseCoMapShape> = {
    [Key in keyof Shape]?: Shape[Key]["_Value"] extends CoValue ? ValueRef<Shape[Key]["_Value"]> : never;
};
