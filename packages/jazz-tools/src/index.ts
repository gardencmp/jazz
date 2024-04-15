/* eslint-disable @typescript-eslint/no-namespace */
import { BinaryCoStream, CoMap, ImageDefinition, Account as Account_, Group as Group_, CoList, CoStream } from "./internal.js";

/** @category Schemas & CoValues - Schema definers */
export namespace Co {
    export const Map = CoMap;
    export const List = CoList;
    export const Stream = CoStream;
    export const BinaryStream = BinaryCoStream;
    export const Account = Account_;
    export const Group = Group_;
    export namespace media {
        export const ImageDef = ImageDefinition;
        export type ImageDef = ImageDefinition;
    }
}

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

export { ID, CoValue } from "./internal.js";

export { Encoders } from "./internal.js";

export { CoMap, indexSignature } from "./internal.js";
export { CoList } from "./internal.js";
export { CoStream, BinaryCoStream } from "./internal.js";
export { Group, Profile } from "./internal.js";
export { Account, Me } from "./internal.js";
export { ImageDefinition } from "./internal.js";
export { CoValueBase, CoValueClass } from "./internal.js";
