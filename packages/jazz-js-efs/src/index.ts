import { AccountOf } from "./coValues/account/accountOf.js";
import { CoListOf } from "./coValues/coList/coListOf.js";
import { CoMapOf } from "./coValues/coMap/coMapOf.js";
import { BinaryCoStream } from "./coValues/coStream/coStreamOf.js";
import { GroupOf } from "./coValues/group/groupOf.js";

export * as S from "@effect/schema/Schema";

export const Co = {
    map: CoMapOf,
    list: CoListOf,
    stream: CoStreamOf,
    binaryStream: BinaryCoStream,
    account: AccountOf,
    group: GroupOf
};

export { SimpleAccount } from "./coValues/account/accountOf.js";
export { SimpleGroup } from "./coValues/group/groupOf.js";

export { cojsonReady as jazzReady } from "cojson";