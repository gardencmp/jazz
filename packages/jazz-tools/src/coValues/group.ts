import type { Everyone, RawGroup, Role } from "cojson";
import type { CoValue, ID, JsonEncoded, RefEncoded, Schema } from "../internal.js";
import {
    Account,
    CoMap,
    CoValueBase,
    Ref,
    co,
    isControlledAccount,
    AccountAndGroupProxyHandler,
} from "../internal.js";

export class Profile extends CoMap<{ name: co<string> }> {
    name = co.string;
}

export class Group<
        Def extends { profile: Profile | null; root: CoMap | null } = {
            profile: Profile | null;
            root: CoMap | null;
        },
    >
    extends CoValueBase
    implements CoValue<"Group", RawGroup>
{
    declare id: ID<this>;
    declare _type: "Group";
    static {
        this.prototype._type = "Group";
    }
    declare _raw: RawGroup;

    static _schema: any;
    get _schema(): {
        profile: Def["profile"] extends CoValue
            ? RefEncoded<Def["profile"]>
            : JsonEncoded;
        root: Def["root"] extends CoValue
            ? RefEncoded<Def["root"]>
            : JsonEncoded;
    } {
        return (this.constructor as typeof Group)._schema;
    }
    static {
        this._schema = {
            profile: "json" satisfies Schema,
            root: "json" satisfies Schema,
        } as any;
        Object.defineProperty(this.prototype, "_schema", {
            get: () => this._schema,
        });
    }

    profile!: Def["profile"] extends Profile
        ? Def["profile"] | null
        : undefined;

    root!: Def["root"] extends CoMap ? Def["root"] | null : undefined;

    get _refs(): {
        profile: Def["profile"] extends Profile ? Ref<Def["profile"]> : never;
        root: Def["root"] extends CoMap ? Ref<Def["root"]> : never;
    } {
        const profileID = this._raw.get("profile") as unknown as
            | ID<NonNullable<Def["profile"]>>
            | undefined;
        const rootID = this._raw.get("root") as unknown as
            | ID<NonNullable<Def["root"]>>
            | undefined;
        return {
            profile:
                profileID &&
                (new Ref(
                    profileID,
                    this._loadedAs,
                    this._schema.profile as RefEncoded<
                        NonNullable<Def["profile"]>
                    >
                ) as any),
            root:
                rootID &&
                (new Ref(
                    rootID,
                    this._loadedAs,
                    this._schema.root as RefEncoded<NonNullable<Def["root"]>>
                ) as any),
        };
    }

    constructor(options: { owner: Account | Group });
    constructor(init: any, options: { fromRaw: RawGroup });
    constructor(init: undefined, options: { owner: Account | Group });
    constructor(
        init: undefined | { owner: Account | Group },
        options?: { fromRaw: RawGroup } | { owner: Account | Group }
    ) {
        super();
        let raw: RawGroup;

        if (options && "fromRaw" in options) {
            raw = options.fromRaw;
        } else {
            const initOwner = options?.owner || init?.owner;
            if (!initOwner) throw new Error("No owner provided");
            if (
                initOwner instanceof Account &&
                isControlledAccount(initOwner)
            ) {
                const rawOwner = initOwner._raw;
                raw = rawOwner.createGroup();
            } else {
                throw new Error(
                    "Can only construct group as a controlled account"
                );
            }
        }

        Object.defineProperties(this, {
            id: {
                value: raw.id,
                enumerable: false,
            },
            _raw: { value: raw, enumerable: false },
        });

        return new Proxy(
            this,
            AccountAndGroupProxyHandler as ProxyHandler<this>
        );
    }

    myRole(): Role | undefined {
        return this._raw.myRole();
    }

    addMember(member: Everyone | Account, role: Role) {
        this._raw.addMember(member === "everyone" ? member : member._raw, role);
    }
}
