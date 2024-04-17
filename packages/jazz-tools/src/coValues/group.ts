import type { CoID, Everyone, RawCoMap, RawGroup, Role } from "cojson";
import type {
    CoValue,
    CoValueClass,
    ID,
    JsonEncoded,
    RefEncoded,
} from "../internal.js";
import {
    Account,
    CoMap,
    CoValueBase,
    Ref,
    isControlledAccount,
} from "../internal.js";

export class Profile extends CoMap<{ name: string }> {
    declare name: string;
}
Profile.encoding({ name: "json" });

export class Group<
        Def extends { profile: Profile | null; root: CoMap | null } = {
            profile: Profile | null;
            root: CoMap | null;
        },
    >
    extends CoValueBase
    implements CoValue<"Group", RawGroup>
{
    id!: ID<this>;
    _type!: "Group";
    static {
        this.prototype._type = "Group";
    }
    _raw!: RawGroup;

    static _encoding: any;
    get _encoding(): {
        profile: Def["profile"] extends CoValue
            ? RefEncoded<Def["profile"]>
            : JsonEncoded;
        root: Def["root"] extends CoValue
            ? RefEncoded<Def["root"]>
            : JsonEncoded;
    } {
        return (this.constructor as typeof Group)._encoding;
    }
    static {
        this._encoding = {
            profile: { json: true },
            root: { json: true },
        } as any;
        Object.defineProperty(this.prototype, "_encoding", {
            get: () => this._encoding,
        });
    }

    profile!: Def["profile"] extends Profile
        ? Def["profile"] | null
        : undefined;

    root!: Def["root"] extends CoMap ? Def["root"] | null : undefined;

    get _refs(): {
        profile: Def["profile"] extends Profile
            ? Ref<Def["profile"]>
            : never;
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
                    (
                        this._encoding.profile as RefEncoded<
                            NonNullable<Def["profile"]>
                        >
                    ).ref()
                ) as any),
            root:
                rootID &&
                (new Ref(
                    rootID,
                    this._loadedAs,
                    (
                        this._encoding.root as RefEncoded<
                            NonNullable<Def["root"]>
                        >
                    ).ref()
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
            profile: {
                get: () => {
                    const ref = this._refs.profile;
                    return ref ? ref.accessFrom(this) : (undefined as any);
                },
                set: (value: Def["profile"] | null) => {
                    if (value) {
                        this._raw.set(
                            "profile",
                            value.id as unknown as CoID<RawCoMap>
                        );
                    }
                },
            },
            root: {
                get: () => {
                    const ref = this._refs.root;
                    return ref ? ref.accessFrom(this) : (undefined as any);
                },
                set: (value: Def["root"] | null) => {
                    if (value) {
                        this._raw.set(
                            "root",
                            value.id as unknown as CoID<RawCoMap>
                        );
                    }
                },
            },
        });
    }

    myRole(): Role | undefined {
        return this._raw.myRole();
    }

    addMember(member: Everyone | Account, role: Role) {
        this._raw.addMember(member === "everyone" ? member : member._raw, role);
    }

    static define<V extends Account>(
        this: CoValueClass<V> & typeof Account,
        fields: {
            profile: V["_encoding"]["profile"];
            root: V["_encoding"]["root"];
        }
    ) {
        this._encoding ||= {};
        Object.assign(this._encoding, fields);
    }
}
