import {
    isCoList,
    isCoListSchema
} from "./coValues/coList.js";
import {
    isCoMap,
    isCoMapSchema
} from "./coValues/coMap.js";
import {
    isAccount,
    isAccountSchema
} from "./coValues/account.js";
import { isGroup, isGroupSchema } from "./coValues/group.js";
import {
    isCoStream,
    isCoStreamSchema
} from "./coValues/coStream.js";
import {
    isBinaryCoStream,
    isBinaryCoStreamSchema
} from "./coValues/binaryCoStream.js";
import { CoValueSchema, CoValue } from "./index.js";


export function isCoValueSchema(value: unknown): value is CoValueSchema {
    return (
        isCoMapSchema(value) ||
        isCoListSchema(value) ||
        isCoStreamSchema(value) ||
        isBinaryCoStreamSchema(value) ||
        isGroupSchema(value) ||
        isAccountSchema(value)
    );
}

export function isCoValue(value: unknown): value is CoValue {
    return (
        isCoMap(value) ||
        isCoList(value) ||
        isCoStream(value) ||
        isBinaryCoStream(value) ||
        isGroup(value) ||
        isAccount(value)
    );
}
