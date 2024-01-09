import {
    LocalNode,
    Group as RawGroup,
    Role,
} from "cojson";
import {
    CoValue,
    CoValueSchemaBase,
    ID,
} from "./index.js";
import { Schema } from "./schema.js";
import { NullSchema, imm } from "./primitives.js";
import { CoMapSchema } from "./coMap.js";
import { Account, ControlledAccount } from "./account.js";
import { Effect } from "effect";
import { CoValueUnavailableError, UnknownCoValueLoadError } from "./errors.js";

/** @category CoValues - Group */
export interface Group<
    ProfileS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> {
    /** @hidden */
    _raw: RawGroup;
    /** @category Collaboration */
    id: ID<Group<ProfileS, RootS>>;

    /** @category Collaboration */
    meta: GroupMeta<ProfileS, RootS>;

    /** @category Data Roots */
    profile: ProfileS["_Value"] | undefined;
    /** @category Data Roots */
    root: RootS["_Value"] | undefined;

    /** @category Mutation */
    addMember(member: Account | "everyone", role: Role): this;
}

export class GroupMeta<
    ProfileS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    RootS extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> {
    node: LocalNode;

    constructor(raw: RawGroup) {
        this.node = raw.core.node;
    }
}

/** @category CoValues - Group */
export interface GroupSchema<
    P extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    R extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
> extends Schema<Group<P, R>>,
        CoValueSchemaBase<Group<P, R>, RawGroup> {
    _Type: "group";
    _Profile: P;
    _Root: R;
    _RawValue: RawGroup;

    new (options: { admin: ControlledAccount }): Group<P, R>;

    fromRaw(raw: RawGroup, onGetRef?: (id: ID<CoValue>) => void): Group<P, R>;
}

/** @category CoValues - Group */
export function isGroupSchema(value: unknown): value is GroupSchema {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "group"
    );
}

/** @category CoValues - Group */
export function isGroup(value: unknown): value is Group {
    return (
        typeof value === "object" &&
        value !== null &&
        isGroupSchema(value.constructor) &&
        "id" in value
    );
}

/** @category CoValues - Group */
export function GroupWith<
    P extends CoMapSchema | NullSchema = CoMapSchema | NullSchema,
    R extends CoMapSchema | NullSchema = CoMapSchema | NullSchema
>(ProfileS: P, RootS: R): GroupSchema<P, R> {
    return class GroupSchema {
        static _Type = "group" as const;
        static _Profile = ProfileS;
        static _Root = RootS;
        static _Value: Group<P, R>;
        static _RawValue: RawGroup;

        _raw: RawGroup;
        id: ID<Group<P, R>>;
        meta: GroupMeta<P, R>;

        constructor(options: { admin: ControlledAccount });
        constructor(options: { fromRaw: RawGroup });
        constructor(
            options: { admin: ControlledAccount } | { fromRaw: RawGroup }
        ) {
            if ("fromRaw" in options) {
                this._raw = options.fromRaw;
            } else {
                const rawAdmin = options.admin._raw;

                if (!("createGroup" in rawAdmin)) {
                    throw new Error(
                        "Admin account for new group must be controlled"
                    );
                }

                this._raw = rawAdmin.createGroup();
            }
            this.id = this._raw.id as unknown as ID<Group<P, R>>;
            this.meta = new GroupMeta(this._raw);
        }

        static fromRaw(
            raw: RawGroup,
            _onGetRef?: (id: ID<CoValue>) => void
        ): Group<P, R> {
            return new this({ fromRaw: raw });
        }

        static load(
            id: ID<Group<P, R>>,
            { as }: { as: ControlledAccount }
        ): Promise<Group<P, R>> {
            throw new Error("Not implemented");
        }

        static loadEf(
            id: ID<Group<P, R>>
        ): Effect.Effect<
            ControlledAccount,
            CoValueUnavailableError | UnknownCoValueLoadError,
            Group<P, R>
        > {
            throw new Error("Not implemented");
        }

        get profile() {
            const id = this._raw.get("profile");

            if (!id) {
                return null;
            } else {
                // TODO
            }
        }

        get root() {
            const id = this._raw.get("root");

            if (!id) {
                return null;
            } else {
                // TODO
            }
        }

        addMember(member: Account | "everyone", role: Role): this {
            if (typeof member === "string" && member === "everyone") {
                this._raw.addMember("everyone", role);
            } else {
                this._raw.addMember(member._raw, role);
            }
            return this;
        }
    } satisfies GroupSchema<P, R>;
}

/** @category CoValues - Group */
export const Group = GroupWith(imm.null, imm.null);
