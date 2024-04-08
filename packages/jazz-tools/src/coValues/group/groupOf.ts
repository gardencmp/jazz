import {
    CoValueSchema,
    ID,
    inspect,
    isCoValueSchema,
} from "../../coValueInterfaces.js";
import * as S from "@effect/schema/Schema";
import { AnyGroup, GroupSchema } from "./group.js";
import {
    AnyAccount,
    ControlledAccount,
    isControlledAccount,
} from "../account/account.js";
import { AST, Schema } from "@effect/schema";
import { constructorOfSchemaSym } from "../resolution.js";
import { pipeArguments } from "effect/Pipeable";
import { CoID, Everyone, RawGroup, Role } from "cojson";
import { ValueRef } from "../../refs.js";
import { controlledAccountFromNode } from "../account/accountOf.js";
import { SharedCoValueConstructor } from "../construction.js";

export function GroupOf<
    P extends CoValueSchema | S.Schema<null>,
    R extends CoValueSchema | S.Schema<null>,
>(fields: { profile: P; root: R }) {
    class GroupOfProfileAndRoot
        extends SharedCoValueConstructor
        implements AnyGroup<P, R>
    {
        static get ast() {
            return AST.setAnnotation(
                Schema.instanceOf(this).ast,
                constructorOfSchemaSym,
                this
            );
        }
        static [Schema.TypeId]: Schema.Schema.Variance<
            AnyGroup<P, R> & GroupOfProfileAndRoot,
            AnyGroup<P, R> & GroupOfProfileAndRoot,
            never
        >[Schema.TypeId];
        static pipe() {
            // eslint-disable-next-line prefer-rest-params
            return pipeArguments(this, arguments);
        }
        static type = "Group" as const;

        id!: ID<this>;
        _type!: "Group";
        _owner!: AnyAccount | AnyGroup;
        _refs!: AnyGroup<P, R>["_refs"];
        _raw!: RawGroup;
        _loadedAs!: ControlledAccount;
        _schema!: typeof GroupOfProfileAndRoot;

        constructor(options: { owner: AnyAccount | AnyGroup });
        constructor(init: any, options: { fromRaw: RawGroup });
        constructor(init: undefined, options: { owner: AnyAccount | AnyGroup });
        constructor(
            init: undefined | { owner: AnyAccount | AnyGroup },
            options?: { fromRaw: RawGroup } | { owner: AnyAccount | AnyGroup }
        ) {
            super();
            let raw: RawGroup;

            if (options && "fromRaw" in options) {
                raw = options.fromRaw;
            } else {
                const initOwner = options?.owner || init?.owner;
                if (!initOwner) throw new Error("No owner provided");
                if (isControlledAccount(initOwner)) {
                    const rawOwner = initOwner._raw;
                    raw = rawOwner.createGroup();
                } else {
                    throw new Error(
                        "Can only construct group as a controlled account"
                    );
                }
            }

            const refs = {
                get profile() {
                    if (isCoValueSchema(fields.profile)) {
                        const profileID = raw.get("profile");
                        return (
                            profileID &&
                            new ValueRef(
                                profileID as unknown as ID<
                                    Schema.Schema.To<typeof fields.profile>
                                >,
                                controlledAccountFromNode(raw.core.node),
                                fields.profile
                            )
                        );
                    }
                },
                get root() {
                    if (isCoValueSchema(fields.root)) {
                        const rootID = raw.get("root");
                        return (
                            rootID &&
                            new ValueRef(
                                rootID as unknown as ID<
                                    Schema.Schema.To<typeof fields.root>
                                >,
                                controlledAccountFromNode(raw.core.node),
                                fields.root
                            )
                        );
                    }
                },
            };

            Object.defineProperties(this, {
                id: { value: raw.id, enumerable: false },
                _type: { value: "Group", enumerable: false },
                _owner: { value: this, enumerable: false },
                _refs: { value: refs, enumerable: false },
                _raw: { value: raw, enumerable: false },
                _loadedAs: {
                    get: () => controlledAccountFromNode(raw.core.node),
                    enumerable: false,
                },
                _schema: { value: GroupOfProfileAndRoot, enumerable: false },
            });
        }

        static fromRaw(raw: RawGroup) {
            return new GroupOfProfileAndRoot(undefined, {
                fromRaw: raw,
            });
        }

        get profile(): S.Schema.To<P> | undefined {
            return this._refs.profile.accessFrom(this);
        }

        set profile(value: S.Schema.To<P> | undefined) {
            this._raw.set(
                "profile",
                value?.id || (null as unknown as CoID<any> | null)
            );
        }

        get root(): S.Schema.To<R> | undefined {
            return this._refs.root.accessFrom(this);
        }

        set root(value: S.Schema.To<R> | undefined) {
            this._raw.set(
                "root",
                value?.id || (null as unknown as CoID<any> | null)
            );
        }

        addMember(member: AnyAccount | Everyone, role: Role) {
            this._raw.addMember(
                typeof member === "string" ? member : member._raw,
                role
            );

            return this;
        }

        myRole(): Role | undefined {
            return this._raw.myRole();
        }

        toJSON() {
            return {
                co: {
                    id: this.id,
                    type: this._type,
                },
                profile: this.profile?.toJSON(),
                root: this.root?.toJSON(),
            };
        }

        [inspect]() {
            return this.toJSON();
        }
    }

    return {
        HINT: (_: never) =>
            "Remember to do `class SubClass extends Co.group(...)👉.as<SubClass>()👈 {}`" as const,
        as<SubClass>() {
            return GroupOfProfileAndRoot as unknown as GroupSchema<
                SubClass,
                P,
                R
            >;
        },
    };
}

export class Group extends GroupOf({
    profile: S.null,
    root: S.null,
}).as<Group>() {}
