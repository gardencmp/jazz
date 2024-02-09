import { CoMapOf } from "../coMap/impl.js";
import { AccountWith } from "./impl.js";
import { NullSchema, StringSchema } from "../../immutables/primitives.js";

/** @category CoValues - Account */

export const SimpleAccount = AccountWith(
    CoMapOf({
        name: new StringSchema(),
    }),
    new NullSchema()
);
