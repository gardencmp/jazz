import { CoMapOf } from "../coMap/impl.js";
import { AccountWith } from "./impl.js";
import { NullSchema, StringSchema } from "../../immutables/primitives.js";

/** @category CoValues - Account */

class SimpleAccountProfile extends CoMapOf({
    name: new StringSchema(),
}) {}

export const SimpleAccount = AccountWith<typeof SimpleAccountProfile, NullSchema>(
    SimpleAccountProfile,
    new NullSchema()
);
