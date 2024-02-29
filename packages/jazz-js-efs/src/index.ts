import { AccountOf } from "./coValues/account/accountOf.js";
import { CoMapOf } from "./coValues/coMap/coMapOf.js";
import { GroupOf } from "./coValues/group/groupOf.js";

export * as S from "@effect/schema/Schema";

export const Co = {
    map: CoMapOf,
    account: AccountOf,
    group: GroupOf
};

export { SimpleAccount } from "./coValues/account/accountOf.js";
export { SimpleGroup } from "./coValues/group/groupOf.js";

export { cojsonReady as jazzReady } from "cojson";