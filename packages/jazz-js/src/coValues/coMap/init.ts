import { Schema } from "../../schema.js";
import { BaseCoMapShape } from "./coMap.js";

type AllowOmitNull<T extends Record<string, unknown>> = {
    [Key in keyof T as null extends T[Key] ? never : Key]: T[Key];
} & {
    [Key in keyof T as null extends T[Key] ? Key : never]?:
        | T[Key]
        | null
        | undefined;
};

type CoMapInitBase<Shape extends BaseCoMapShape> = AllowOmitNull<{
    [Key in Exclude<keyof Shape, "...">]: Shape[Key]["_Value"];
}> &
    (Shape["..."] extends Schema
        ? AllowOmitNull<{ [Key in Exclude<string, Exclude<keyof Shape, '...'>>]: Shape[keyof Shape]["_Value"] }>
        : Record<never, never>);

export type CoMapInit<Shape extends BaseCoMapShape> = Record<
    string,
    never
> extends CoMapInitBase<Shape>
    ? CoMapInitBase<Shape> | undefined
    : CoMapInitBase<Shape>;
