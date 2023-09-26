import { Everyone, Group, InviteSecret } from "../coValues/group.js";
import { CoID } from "../coValue.js";
import { QueryContext, ValueOrSubQueried } from "../queries.js";
import { CoValueCore } from "../coValueCore.js";
import { Role } from "../permissions.js";
import { AccountID } from "../coValues/account.js";
import { CoMap } from "../coValues/coMap.js";
import { CoList } from "../coValues/coList.js";
import { CoStream } from "../coValues/coStream.js";
import { BinaryCoStream } from "../coValues/coStream.js";

export class QueriedGroup<G extends Group = Group> {
    group!: G;
    id!: CoID<G>;
    type = "group" as const;
    profile?: ValueOrSubQueried<G["_shape"]["profile"]>;

    constructor(group: G, queryContext: QueryContext) {
        const profileID = group.get("profile");
        Object.defineProperties(this, {
            group: {
                get() {
                    return group;
                },
                enumerable: false,
            },
            id: { value: group.id, enumerable: false },
            type: { value: "group", enumerable: false },
            profile: {
                value: profileID && queryContext.resolveValue(profileID),
                enumerable: false,
            },
        });
    }

    get meta(): G["meta"] {
        return this.group.meta;
    }

    get core(): CoValueCore {
        return this.group.core;
    }

    addMember(accountID: AccountID | Everyone, role: Role): G {
        return this.group.addMember(accountID, role);
    }

    removeMember(accountID: AccountID): G {
        return this.group.removeMember(accountID);
    }

    createInvite(role: "reader" | "writer" | "admin"): InviteSecret {
        return this.group.createInvite(role);
    }

    createMap<M extends CoMap>(
        init?: {
            [K in keyof M["_shape"]]: M["_shape"][K];
        },
        meta?: M["meta"],
        initPrivacy: "trusting" | "private" = "trusting"
    ): M {
        return this.group.createMap(init, meta, initPrivacy);
    }

    createList<L extends CoList>(
        init?: L["_item"][],
        meta?: L["meta"],
        initPrivacy: "trusting" | "private" = "trusting"
    ): L {
        return this.group.createList(init, meta, initPrivacy);
    }

    createStream<C extends CoStream>(meta?: C["meta"]): C {
        return this.group.createStream(meta);
    }

    createBinaryStream<C extends BinaryCoStream>(
        meta: C["meta"] = { type: "binary" }
    ): C {
        return this.group.createBinaryStream(meta);
    }
}
