import { AccountOf } from "./coValues/account/accountOf.js";
import { CoListOf } from "./coValues/coList/coListOf.js";
import { CoMapOf } from "./coValues/coMap/coMapOf.js";
import {
    BinaryCoStreamImpl,
    CoStreamOf,
} from "./coValues/coStream/coStreamOf.js";
import { GroupOf } from "./coValues/group/groupOf.js";

/** @hidden */
export * as S from "@effect/schema/Schema";

/** @category Schemas - Schema bases */
export const Co = {
    map: CoMapOf,
    list: CoListOf,
    stream: CoStreamOf,
    binaryStream: BinaryCoStreamImpl,
    account: AccountOf,
    group: GroupOf,
};

/** @category Internal types */
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

export { ID, CoValue, CoValueSchema, CoValueCo } from "./coValueInterfaces.js";


export { CoMap, CoMapSchema } from "./coValues/coMap/coMap.js";
/** @category Schemas & CoValues - CoMap */
export * as CoMapInternals from "./coValues/coMap/internalDocs.js";

export { CoList, CoListSchema } from "./coValues/coList/coList.js";
/** @category Schemas & CoValues - CoList */
export * as CoListInternals from "./coValues/coList/internalDocs.js";

/** @category Schemas & CoValues - CoStream */
export {
    CoStream,
    CoStreamSchema,
    BinaryCoStream,
} from "./coValues/coStream/coStream.js";

/** @category Schemas & CoValues - Account */
export {
    Account,
    ControlledAccount,
    AccountSchema,
    controlledAccountSym,
} from "./coValues/account/account.js";
/** @category Schemas & CoValues - Account */
export { AccountMigration } from "./coValues/account/migration.js";
/** @category Schemas & CoValues - Account */
export { SimpleAccount } from "./coValues/account/accountOf.js";
/** @category Schemas & CoValues - Group */
export { Group } from "./coValues/group/group.js";
/** @category Schemas & CoValues - Group */
export { SimpleGroup } from "./coValues/group/groupOf.js";