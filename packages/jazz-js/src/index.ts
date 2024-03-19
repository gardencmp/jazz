import { AccountOf } from "./coValues/account/accountOf.js";
import { CoListOf } from "./coValues/coList/coListOf.js";
import { CoMapOf } from "./coValues/coMap/coMapOf.js";
import {
    BinaryCoStreamImpl,
    CoStreamOf,
} from "./coValues/coStream/coStreamOf.js";
import { GroupOf } from "./coValues/group/groupOf.js";

export * as S from "@effect/schema/Schema";

export const Co = {
    map: CoMapOf,
    list: CoListOf,
    stream: CoStreamOf,
    binaryStream: BinaryCoStreamImpl,
    account: AccountOf,
    group: GroupOf,
};

export {
    cojsonReady as jazzReady,
    InviteSecret,
    Peer,
    SessionID,
    AgentID,
    SyncMessage,
    cojsonInternals,
    MAX_RECOMMENDED_TX_SIZE,
} from "cojson";
export { ID, CoValue, CoValueSchema } from "./coValueInterfaces.js";

export { CoMap, CoMapSchema } from "./coValues/coMap/coMap.js";
export { CoList, CoListSchema } from "./coValues/coList/coList.js";
export {
    CoStream,
    CoStreamSchema,
    BinaryCoStream,
} from "./coValues/coStream/coStream.js";

export {
    Account,
    ControlledAccount,
    AccountSchema,
    controlledAccountSym,
} from "./coValues/account/account.js";
export { AccountMigration } from "./coValues/account/migration.js";
export { SimpleAccount } from "./coValues/account/accountOf.js";
export { Group } from "./coValues/group/group.js";
export { SimpleGroup } from "./coValues/group/groupOf.js";
