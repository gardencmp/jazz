import {
    isCoList,
    isCoListSchema
} from "./coList.js";
import {
    isCoMap,
    isCoMapSchema
} from "./coMap.js";
import {
    isAccount,
    isAccountSchema
} from "./account.js";
import { isGroup, isGroupSchema } from "./group.js";
import {
    isBinaryCoStream,
    isBinaryCoStreamSchema,
    isCoStream,
    isCoStreamSchema
} from "./coStream.js";
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
