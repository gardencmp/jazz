import { CoValueSchema, ID, inspect } from "../../coValueInterfaces.js";
import * as S from "@effect/schema/Schema";
import { Group, GroupSchema } from "./group.js";
import {
    Account,
    ControlledAccount,
    ProfileSchema,
    isControlledAccount,
} from "../account/account.js";
import { AST, Schema } from "@effect/schema";
import { constructorOfSchemaSym } from "../resolution.js";
import { pipeArguments } from "effect/Pipeable";
import { AccountID, Everyone, RawGroup, Role } from "cojson";
import { ValueRef } from "../../refs.js";
import { controlledAccountFromNode } from "../account/accountOf.js";
import { SharedCoValueConstructor } from "../construction.js";

export function GroupOf<
    P extends ProfileSchema | S.Schema<null>,
    R extends CoValueSchema | S.Schema<null>,
>(fields: { profile: P; root: R }) {
    class GroupOfProfileAndRoot
        extends SharedCoValueConstructor
        implements Group<P, R>
    {
        static get ast() {
            return AST.setAnnotation(
                Schema.instanceOf(this).ast,
                constructorOfSchemaSym,
                this
            );
        }
        static [Schema.TypeId]: Schema.Schema.Variance<
            Group<P, R> & GroupOfProfileAndRoot,
            Group<P, R> & GroupOfProfileAndRoot,
            never
        >[Schema.TypeId];
        static pipe() {
            // eslint-disable-next-line prefer-rest-params
            return pipeArguments(this, arguments);
        }
        static type = "Group" as const;

        id!: ID<this>;
        _type!: "Group";
        _owner!: Account | Group;
        _refs!: Group<P, R>["_refs"];
        _raw!: RawGroup;
        _loadedAs!: ControlledAccount;
        _schema!: typeof GroupOfProfileAndRoot;

        constructor(init: any, options: { fromRaw: RawGroup });
        constructor(init: undefined, options: { owner: Account | Group });
        constructor(
            init: undefined,
            options: { fromRaw: RawGroup } | { owner: Account | Group }
        ) {
            super();
            let raw: RawGroup;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
            } else {
                if (isControlledAccount(options.owner)) {
                    const rawOwner = options.owner._raw;
                    raw = rawOwner.createGroup();
                } else {
                    throw new Error(
                        "Can only construct group as a controlled account"
                    );
                }
            }

            const refs = {
                get profile() {
                    return new ValueRef(
                        raw.id as unknown as ID<Schema.Schema.To<P>>,
                        controlledAccountFromNode(raw.core.node),
                        fields.profile
                    );
                },
                get root() {
                    return new ValueRef(
                        raw.id as unknown as ID<Schema.Schema.To<R>>,
                        controlledAccountFromNode(raw.core.node),
                        fields.root
                    );
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

        get root(): S.Schema.To<R> | undefined {
            return this._refs.root.accessFrom(this);
        }

        addMember(member: Account | Everyone, role: Role) {
            this._raw.addMember(
                typeof member === "string" ? member : member._raw,
                role
            );

            return this;
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

        static as<SubClass>() {
            return this as unknown as GroupSchema<SubClass, P, R>;
        }
    }

    return GroupOfProfileAndRoot as GroupSchema<GroupOfProfileAndRoot, P, R> & {
        as<SubClass>(): GroupSchema<SubClass, P, R>;
    };
}

export class SimpleGroup extends GroupOf({ profile: S.null, root: S.null }).as<SimpleGroup>() {}
