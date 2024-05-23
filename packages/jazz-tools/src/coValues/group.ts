import type { AccountID, Everyone, RawGroup, Role } from "cojson";
import type { CoValue, ID, RefEncoded, Schema, ClassOf, Me, UnavailableError, AccountCtx } from "../internal.js";
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
import { DeeplyLoaded, DepthsIn } from "./deepLoading.js";
import { Effect, Stream } from "effect";

/** @category Identity & Permissions */
export class Profile extends CoMap {
    name = co.string;
}

/** @category Identity & Permissions */
export class Group extends CoValueBase implements CoValue<"Group", RawGroup> {
    declare id: ID<this>;
    declare _type: "Group";
    static {
        this.prototype._type = "Group";
    }
    declare _raw: RawGroup;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static _schema: any;
    get _schema(): {
        profile: Schema;
        root: Schema;
        [MembersSym]: RefEncoded<Account>;
    } {
        return (this.constructor as typeof Group)._schema;
    }
    static {
        this._schema = {
            profile: "json" satisfies Schema,
            root: "json" satisfies Schema,
            [MembersSym]: () => Account satisfies Schema,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        Object.defineProperty(this.prototype, "_schema", {
            get: () => this._schema,
        });
    }

    declare profile: Profile | null;
    declare root: CoMap | null;
    declare [MembersSym]: Account | null;

    get _refs() {
        const profileID = this._raw.get("profile") as unknown as
            | ID<NonNullable<this["profile"]>>
            | undefined;
        const rootID = this._raw.get("root") as unknown as
            | ID<NonNullable<this["root"]>>
            | undefined;
        return {
            profile:
                profileID &&
                (new Ref(
                    profileID,
                    this._loadedAs,
                    this._schema.profile as RefEncoded<
                        NonNullable<this["profile"]>
                    >,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ) as any as this["profile"] extends Profile
                    ? Ref<this["profile"]>
                    : never),
            root:
                rootID &&
                (new Ref(
                    rootID,
                    this._loadedAs,
                    this._schema.root as RefEncoded<NonNullable<this["root"]>>,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ) as any as this["root"] extends CoMap
                    ? Ref<this["root"]>
                    : never),
        };
    }

    /** @deprecated Don't use constructor directly, use .create */
    constructor(options: { fromRaw: RawGroup } | { owner: Account | Group }) {
        super();
        let raw: RawGroup;

        if (options && "fromRaw" in options) {
            raw = options.fromRaw;
        } else {
            const initOwner = options.owner;
            if (!initOwner) throw new Error("No owner provided");
            if (
                initOwner instanceof Account &&
                isControlledAccount(initOwner)
            ) {
                const rawOwner = initOwner._raw;
                raw = rawOwner.createGroup();
            } else {
                throw new Error(
                    "Can only construct group as a controlled account",
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
            AccountAndGroupProxyHandler as ProxyHandler<this>,
        );
    }

    static create<G extends Group>(
        this: ClassOf<G>,
        options: { owner: Account },
    ) {
        return new this(options);
    }

    myRole(): Role | undefined {
        return this._raw.myRole();
    }

    addMember(member: Everyone | Account, role: Role) {
        this._raw.addMember(member === "everyone" ? member : member._raw, role);
        return this;
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
                        this._schema[MembersSym],
                    );
                const accessRef = () => ref?.accessFrom(this, "members." + id);

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

    declare load: <Depth extends object>(
        depth: Depth & DepthsIn<this>,
    ) => Promise<DeeplyLoaded<this, Depth> | undefined>;

    declare loadEf: <Depth extends object>(
        depth: Depth & DepthsIn<this>,
    ) => Effect.Effect<DeeplyLoaded<this, Depth>, UnavailableError, never>;

    declare subscribe: <Depth extends object>(
        depth: Depth & DepthsIn<this>,
        listener: (update: DeeplyLoaded<this, Depth>) => void,
    ) => () => void;

    declare subscribeEf: <Depth extends object>(
        depth: Depth & DepthsIn<this>,
    ) => Stream.Stream<DeeplyLoaded<this, Depth>, UnavailableError, never>;

    declare static load: <M extends CoValue, Depth extends object>(
        this: ClassOf<M> & typeof CoValueBase,
        id: ID<M>,
        as: Account & Me,
        depth: Depth & DepthsIn<M>,
    ) => Promise<DeeplyLoaded<M, Depth> | undefined>;

    declare static loadEf: <M extends CoValue, Depth extends DepthsIn<M>>(
        this: ClassOf<M> & typeof CoValueBase,
        id: ID<M>,
        depth: Depth,
    ) => Effect.Effect<DeeplyLoaded<M, Depth>, UnavailableError, AccountCtx>;

    declare static subscribe: <M extends CoValue, Depth extends DepthsIn<M>>(
        this: ClassOf<M> & typeof CoValueBase,
        id: ID<M>,
        as: Account & Me,
        depth: Depth,
        listener: (update: DeeplyLoaded<M, Depth>) => void,
    ) => () => void;

    declare static subscribeEf: <
        M extends CoValue,
        Depth extends DepthsIn<M>,
    >(
        this: ClassOf<M> & typeof CoValueBase,
        id: ID<M>,
        depth: Depth,
    ) => Stream.Stream<DeeplyLoaded<M, Depth>, UnavailableError, AccountCtx>;

}
