import type { CoValueCore } from "./coValueCore.js";
import { Account } from "./coValues/account.js";
import { Group } from "./coValues/group.js";
import { CoMap } from "./coValues/coMap.js";
import { CoList } from "./coValues/coList.js";
import { CoStream } from "./coValues/coStream.js";
import { BinaryCoStream } from "./coValues/coStream.js";

export function coreToCoValue(
    core: CoValueCore,
    options?: { ignorePrivateTransactions: true }
) {
    if (core.header.type === "comap") {
        if (core.header.ruleset.type === "group") {
            if (
                core.header.meta?.type === "account" &&
                !options?.ignorePrivateTransactions
            ) {
                return new Account(core);
            } else {
                return new Group(core, options);
            }
        } else {
            return new CoMap(core);
        }
    } else if (core.header.type === "colist") {
        return new CoList(core);
    } else if (core.header.type === "costream") {
        if (core.header.meta && core.header.meta.type === "binary") {
            return new BinaryCoStream(core);
        } else {
            return new CoStream(core);
        }
    } else {
        throw new Error(`Unknown coValue type ${core.header.type}`);
    }
}
