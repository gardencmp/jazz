import { BooleanSchema, StringSchema, NumberSchema, NullSchema, PrimitiveSchema } from "./primitives.js";

/** @category Immutable Value Schemas */

export const imm = {
    boolean: new BooleanSchema(),
    string: new StringSchema(),
    number: new NumberSchema(),
    null: new NullSchema(),
    tuple: <T extends PrimitiveSchema[]>(...values: T) => new TupleSchema(...values),
};

export class TupleSchema<T extends PrimitiveSchema[]> {
    static _Type = "tuple";
    _Schemas: T;
    _Value!: { [K in keyof T]: T[K]["_Value"] };

    constructor(...values: T) {
        this._Schemas = values;
    }
}
