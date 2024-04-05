import { AccountOf } from "./coValues/account/accountOf.js";
import { CoListOf } from "./coValues/coList/coListOf.js";
import { CoMapOf } from "./coValues/coMap/coMapOf.js";
import {
    BinaryCoStreamImpl,
    CoStreamOf,
} from "./coValues/coStream/coStreamOf.js";
import { ImageDefinition } from "./coValues/extensions/imageDef.js";
import { GroupOf } from "./coValues/group/groupOf.js";

/** @hidden */
export * as S from "@effect/schema/Schema";

/** @category Schemas & CoValues - Schema definers */
export const Co = {
    map: CoMapOf,
    list: CoListOf,
    stream: CoStreamOf,
    binaryStream: BinaryCoStreamImpl,
    account: AccountOf,
    group: GroupOf,
    media: {
        imageDef: ImageDefinition
    }
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

export { ID, CoValue, CoValueSchema } from "./coValueInterfaces.js";


export { CoMap, CoMapSchema } from "./coValues/coMap/coMap.js";
/** @category Schemas & CoValues - CoMap */
export * as CoMapInternals from "./coValues/coMap/internalDocs.js";

export { CoList, CoListSchema } from "./coValues/coList/coList.js";
/** @category Schemas & CoValues - CoList */
export * as CoListInternals from "./coValues/coList/internalDocs.js";

export {
    CoStream,
    CoStreamSchema,
    BinaryCoStream,
} from "./coValues/coStream/coStream.js";

export {
    AnyAccount,
    ControlledAccount,
    AccountSchema,
    controlledAccountSym,
} from "./coValues/account/account.js";

export { AccountMigration } from "./coValues/account/migration.js";
export { Account, BaseProfile } from "./coValues/account/accountOf.js";
export { AnyGroup } from "./coValues/group/group.js";
export { Group } from "./coValues/group/groupOf.js";

export { ImageDefinition } from "./coValues/extensions/imageDef.js";