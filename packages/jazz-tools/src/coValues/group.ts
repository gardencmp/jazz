import type { AccountID, Everyone, RawGroup, Role } from "cojson";
import type {
    CoValue,
    ID,
    JsonEncoded,
    RefEncoded,
    Schema,
} from "../internal.js";
import {
    Account,
    CoMap,
    CoValueBase,
    Ref,
    co,
    isControlledAccount,
    AccountAndGroupProxyHandler,
    MembersSym,
} from "../internal.js";

export class Profile extends CoMap<{ name: co<string> }> {
    name = co.string;
}

type GroupSchema<Def extends Group> = {
    profile: NonNullable<Def["profile"]> extends CoValue
        ? RefEncoded<NonNullable<Def["profile"]>>
        : JsonEncoded;
    root: NonNullable<Def["root"]> extends CoValue
        ? RefEncoded<NonNullable<Def["root"]>>
        : JsonEncoded;
    [MembersSym]: RefEncoded<NonNullable<Def[MembersSym]>>;
};

export class Group<
        Def extends {
            profile: Profile | null;
            root: CoMap | null;
            [MembersSym]: Account | null;
        } = {
            profile: Profile | null;
            root: CoMap | null;
            [MembersSym]: Account | null;
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
    get _schema(): GroupSchema<this> {
        return (this.constructor as typeof Group)._schema;
    }
    static {
        this._schema = {
            profile: "json" satisfies Schema,
            root: "json" satisfies Schema,
            [MembersSym]: () => Account satisfies Schema,
        } as any;
        Object.defineProperty(this.prototype, "_schema", {
            get: () => this._schema,
        });
    }

    declare profile: Def["profile"] | null;
    declare root: Def["root"] | null;
    declare [MembersSym]: Def[MembersSym] | null;

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

    get members() {
        return this._raw
            .keys()
            .filter((key) => {
                return key === "everyone" || key.startsWith("co_");
            })
            .map((id) => {
                const role = this._raw.get(id as Everyone | AccountID);
                const accountID =
                    id === "everyone"
                        ? undefined
                        : (id as unknown as ID<Account>);
                const ref =
                    accountID &&
                    new Ref<NonNullable<this[MembersSym]>>(
                        accountID,
                        this._loadedAs,
                        this._schema[MembersSym]
                    );
                const accessRef = () => ref?.accessFrom(this);

                return {
                    id: id as unknown as Everyone | ID<this[MembersSym]>,
                    role,
                    ref,
                    get account() {
                        return accessRef();
                    },
                };
            });
    }
}
