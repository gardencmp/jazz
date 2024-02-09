import {
    isCoList,
    isCoListSchema
} from "./coValues/coList/guards.js";
import {
    isCoMap,
    isCoMapSchema
} from "./coValues/coMap/guards.js";
import {
    isAccount,
    isAccountSchema
} from "./coValues/account/guards.js";
import { isGroup, isGroupSchema } from "./coValues/group/group.js";
import {
    isCoStream,
    isCoStreamSchema
} from "./coValues/coStream/guards.js";
import {
    isBinaryCoStream,
    isBinaryCoStreamSchema
} from "./coValues/binaryCoStream/guards.js";
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
