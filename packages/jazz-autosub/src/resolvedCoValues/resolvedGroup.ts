import {
    AccountID,
    BinaryCoStream,
    CoID,
    CoList,
    CoMap,
    CoStream,
    Everyone,
    Group,
    InviteSecret,
    Role,
} from "cojson";
import { AutoSubContext, ValueOrResolvedRef } from "../autoSub.js";

export class ResolvedGroupMeta<G extends Group> {
    coValue!: G;
    group!: G;
    headerMeta!: G["headerMeta"];
}

export class ResolvedGroup<G extends Group = Group> {
    id!: CoID<G>;
    coValueType = "group" as const;
    profile?: ValueOrResolvedRef<G["_shape"]["profile"]>;
    root?: ValueOrResolvedRef<G["_shape"]["root"]>;
    meta!: ResolvedGroupMeta<G>;

    constructor(group: G, autoSubContext: AutoSubContext) {
        const profileID = group.get("profile");
        const rootID = group.get("root");
        autoSubContext.defineResolvedRefPropertiesIn(
            Object.defineProperties(this, {
                id: { value: group.id, enumerable: false },
                coValueType: { value: "group", enumerable: false },
                meta: {
                    value: {
                        coValue: group,
                        group,
                        headerMeta: group.headerMeta,
                    },
                    enumerable: false,
                },
            }),
            {
                profile: {
                    value: profileID,
                    enumerable: false,
                },
                root: {
                    value: rootID,
                    enumerable: false,
                },
            },
            [group.id]
        );
    }

    addMember(accountID: AccountID | Everyone, role: Role): G {
        return this.meta.group.addMember(accountID, role);
    }

    removeMember(accountID: AccountID): G {
        return this.meta.group.removeMember(accountID);
    }

    createInvite(role: "reader" | "writer" | "admin"): InviteSecret {
        return this.meta.group.createInvite(role);
    }

    createMap<M extends CoMap>(
        init?: {
            [K in keyof M["_shape"]]: M["_shape"][K];
        },
        meta?: M["headerMeta"],
        initPrivacy: "trusting" | "private" = "private"
    ): M {
        return this.meta.group.createMap(init, meta, initPrivacy);
    }

    createList<L extends CoList>(
        init?: L["_item"][],
        meta?: L["headerMeta"],
        initPrivacy: "trusting" | "private" = "private"
    ): L {
        return this.meta.group.createList(init, meta, initPrivacy);
    }

    createStream<C extends CoStream>(meta?: C["headerMeta"]): C {
        return this.meta.group.createStream(meta);
    }

    createBinaryStream<C extends BinaryCoStream>(
        meta: C["headerMeta"] = { type: "binary" }
    ): C {
        return this.meta.group.createBinaryStream(meta);
    }
}
