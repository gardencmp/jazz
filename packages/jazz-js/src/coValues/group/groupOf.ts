import {
    CoValueCo,
    CoValueSchema,
    ID,
    inspect,
} from "../../coValueInterfaces.js";
import * as S from "@effect/schema/Schema";
import { Group, GroupSchema } from "./group.js";
import {
    Account,
    ProfileSchema,
    isControlledAccount,
} from "../account/account.js";
import { AST, Schema } from "@effect/schema";
import { constructorOfSchemaSym } from "../resolution.js";
import { pipeArguments } from "effect/Pipeable";
import { RawGroup } from "cojson";
import { ValueRef } from "../../refs.js";
import { controlledAccountFromNode } from "../account/accountOf.js";
import { CoValueCoImpl, SharedCoValueConstructor } from "../construction.js";

export function GroupOf<
    Self,
    P extends ProfileSchema | S.Schema<null>,
    R extends CoValueSchema | S.Schema<null>,
>(fields: { profile: P; root: R }): GroupSchema<Self, P, R> {
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
            Group<P, R> & Self,
            Group<P, R> & Self,
            never
        >[Schema.TypeId];
        static pipe() {
            // eslint-disable-next-line prefer-rest-params
            return pipeArguments(this, arguments);
        }
        static type = "Group" as const;

        co: CoValueCo<"Group", this, RawGroup> & {
            refs: {
                profile: ValueRef<S.Schema.To<P>>;
                root: ValueRef<S.Schema.To<R>>;
            };
        };

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
                    const rawOwner = options.owner.co.raw;
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

            this.co = new CoValueCoImpl(
                raw.id as unknown as ID<this>,
                "Group",
                raw,
                this.constructor as GroupSchema<this, P, R>,
                refs
            );
        }

        static fromRaw(raw: RawGroup) {
            return new GroupOfProfileAndRoot(undefined, {
                fromRaw: raw,
            });
        }

        get profile(): S.Schema.To<P> | undefined {
            return this.co.refs.profile.accessFrom(this);
        }

        get root(): S.Schema.To<R> | undefined {
            return this.co.refs.root.accessFrom(this);
        }

        toJSON() {
            return {
                co: {
                    id: this.co.id,
                    type: this.co.type,
                },
                profile: this.profile?.toJSON(),
                root: this.root?.toJSON(),
            };
        }

        [inspect]() {
            return this.toJSON();
        }
    }

    return GroupOfProfileAndRoot as GroupSchema<Self, P, R>;
}

export const SimpleGroup = GroupOf({ profile: S.null, root: S.null });
