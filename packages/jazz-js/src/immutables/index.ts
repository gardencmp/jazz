import { BooleanSchema, StringSchema, NumberSchema, NullSchema } from "./primitives.js";
import { ImmMapOf } from "./map.js";

/** @category Immutable Value Schemas */

export const imm = {
    boolean: new BooleanSchema(),
    string: new StringSchema(),
    number: new NumberSchema(),
    null: new NullSchema(),
    map: ImmMapOf
};
