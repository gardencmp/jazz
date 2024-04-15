import type { CoID, Everyone, RawCoMap, RawGroup, Role } from "cojson";
import type {
    CoValue,
    CoValueClass,
    ID,
    PrimitiveField,
    RefField,
} from "../internal.js";
import {
    Account,
    CoMap,
    CoValueBase,
    ValueRef,
    isControlledAccount,
} from "../internal.js";

export class Profile extends CoMap<{ name: string }> {
    declare name: string;

    static {
        this.encoding({ name: "json" } as any);
    }
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
    id!: ID<this>;
    _type!: "Group";
    static {
        this.prototype._type = "Group";
    }
    _raw!: RawGroup;

    static _schema: any;
    get _schema(): {
        profile: Def["profile"] extends CoValue
            ? RefField<Def["profile"]>
            : PrimitiveField;
        root: Def["root"] extends CoValue
            ? RefField<Def["root"]>
            : PrimitiveField;
    } {
        return (this.constructor as typeof Group)._schema;
    }
    static {
        this._schema = {
            profile: { json: true },
            root: { json: true },
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
        profile: Def["profile"] extends Profile
            ? ValueRef<Def["profile"]>
            : never;
        root: Def["root"] extends CoMap ? ValueRef<Def["root"]> : never;
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
                (new ValueRef(
                    profileID,
                    this._loadedAs,
                    (
                        this._schema.profile as RefField<
                            NonNullable<Def["profile"]>
                        >
                    ).ref()
                ) as any),
            root:
                rootID &&
                (new ValueRef(
                    rootID,
                    this._loadedAs,
                    (
                        this._schema.root as RefField<NonNullable<Def["root"]>>
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
            profile: V["_schema"]["profile"];
            root: V["_schema"]["root"];
        }
    ) {
        this._schema ||= {};
        Object.assign(this._schema, fields);
    }
}
