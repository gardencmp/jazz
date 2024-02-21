import { BooleanSchema, StringSchema, NumberSchema, NullSchema } from "./primitives.js";

/** @category Immutable Value Schemas */

export const imm = {
    boolean: new BooleanSchema(),
    string: new StringSchema(),
    number: new NumberSchema(),
    null: new NullSchema(),
};
