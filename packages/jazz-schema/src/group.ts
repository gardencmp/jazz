import { Group as RawGroup } from "cojson";
import { CoValue, ID, NullSchema, RawType, Schema } from ".";
import { CoMapClass } from "./coMap.js";

export interface Group<
    ProfileSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema,
    RootSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema
> {
    _raw: RawGroup;
    id: ID<Group<ProfileSchema, RootSchema>>;
    profile: ProfileSchema["_Value"] | undefined;
    root: RootSchema["_Value"] | undefined;
}

export interface GroupClass<
    ProfileSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema,
    RootSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema
> extends Schema<Group<ProfileSchema, RootSchema>> {
    _Type: "group";
    _Profile: ProfileSchema;
    _Root: RootSchema;

    new (opts: { admin: any }): Group<ProfileSchema, RootSchema>;
    new (opts: { fromInner: RawGroup }): Group<ProfileSchema, RootSchema>;

    fromRaw(raw: RawGroup, onGetRef?: (id: ID<CoValue>) => void): Group<ProfileSchema, RootSchema>;
}

export function isGroupClass(value: any): value is GroupClass {
    return typeof value === "object" && value !== null && value._Type === "group";
}

export function isGroup(value: any): value is Group {
    return isGroupClass(value) && "id" in value;
}

export function GroupFor<
    ProfileSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema,
    RootSchema extends CoMapClass | NullSchema = CoMapClass | NullSchema
>(
    ProfileSchema: ProfileSchema,
    RootSchema: RootSchema
): GroupClass<ProfileSchema, RootSchema> {
    return class GroupClass {
        static _Type = "group" as const;
        static _Profile = ProfileSchema;
        static _Root = RootSchema;
        static _Value: Group<ProfileSchema, RootSchema>;

        _raw: RawGroup;
        id: ID<Group<ProfileSchema, RootSchema>>;

        constructor(opts: { admin: any });
        constructor(opts: { fromInner: RawGroup });
        constructor(opts: { admin: any } | { fromInner: RawGroup }) {
            if ("fromInner" in opts) {
                this._raw = opts.fromInner;
            } else {
            }
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
    } satisfies GroupClass<ProfileSchema, RootSchema>;
}
