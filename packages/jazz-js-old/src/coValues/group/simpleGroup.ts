import { NullSchema } from "../../immutables/primitives.js";
import { GroupWith } from "./group.js";

/** @category CoValues - Group */

export const SimpleGroup = GroupWith(new NullSchema(), new NullSchema());
