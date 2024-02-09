import { Schema } from "./schema.js";

export class BooleanSchema extends Schema<boolean> {
    static _Type = "boolean";
    static _Value: boolean;
}

export class StringSchema extends Schema<string> {
    static _Type = "string";
    static _Value: string;
}

export class NumberSchema extends Schema<number> {
    static _Type = "number";
    static _Value: number;
}

export class NullSchema extends Schema<null> {
    static _Type = "null";
    static _Value: null;
}

export class TupleSchema<T extends Schema[]> extends Schema<
    { [K in keyof T]: T[K]["_Value"] }
> {
    static _Type = "tuple";
    _Items: T;

    constructor(items: T) {
        super();
        this._Items = items;
    }
}

export class ConstSchema<Value extends Primitive> extends Schema<Value> {
    static _Type = "const";
    _Value: Value;

    constructor(value: Value) {
        super();
        this._Value = value;
    }
}
/** @category Immutable Value Schemas */

export const imm = {
    boolean: new BooleanSchema(),
    string: new StringSchema(),
    number: new NumberSchema(),
    null: new NullSchema(),
    tuple: <T extends Schema[]>(...items: T) => new TupleSchema(items),
};

export type Primitive = string | number | boolean | null;
