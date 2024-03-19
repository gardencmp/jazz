import {
    AccountID,
    BinaryStreamInfo,
    JsonValue,
    RawCoStream,
    SessionID,
} from "cojson";
import { CoValueSchema, ID, inspect } from "../../coValueInterfaces.js";
import { Account } from "../account/account.js";
import { Group } from "../group/group.js";
import {
    BinaryCoStream,
    BinaryCoStreamSchema,
    CoStreamCo,
    CoStreamSchema,
} from "./coStream.js";
import { SharedCoValueConstructor } from "../construction.js";
import { AST, Schema } from "@effect/schema";
import {
    constructorOfSchemaSym,
    propertyIsCoValueSchema,
} from "../resolution.js";
import { pipeArguments } from "effect/Pipeable";
import { ValueRef } from "../../refs.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { controlledAccountFromNode } from "../account/accountOf.js";
import { is } from "effect/Match";

function CoStreamOfHelper<
    Self,
    Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
>(itemSchema: Item) {
    const decodeItem = Schema.decodeSync(itemSchema);
    const encodeItem = Schema.encodeSync(itemSchema);
    const itemIsCoValue = propertyIsCoValueSchema(itemSchema);

    class CoStreamOfItem extends SharedCoValueConstructor {
        static get ast() {
            return AST.setAnnotation(
                Schema.instanceOf(this).ast,
                constructorOfSchemaSym,
                this
            );
        }
        static [Schema.TypeId]: Schema.Schema.Variance<
            CoStreamOfItem,
            CoStreamOfItem,
            never
        >[Schema.TypeId];
        static pipe() {
            return pipeArguments(this, arguments);
        }
        static type = "CoStream" as const;

        co!: CoStreamCo<this, Item>;

        by: {
            [key: ID<Account>]: Schema.Schema.To<Item>
        };
        in: {
            [key: SessionID]: Schema.Schema.To<Item>
        };

        constructor(
            init: Schema.Schema.To<Item>[] | undefined,
            options: { owner: Account | Group } | { fromRaw: RawCoStream }
        ) {
            super();

            let raw: RawCoStream;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
            } else {
                const rawOwner = options.owner.co.raw;

                raw = rawOwner.createStream();
            }

            const byRefs: {
                [key: ID<Account>]: Item extends CoValueSchema<
                    infer _,
                    infer Value
                >
                    ? { latest: ValueRef<Value>; all: ValueRef<Value>[] }
                    : never;
            } = {};
            const inRefs: {
                [key: SessionID]: Item extends CoValueSchema<
                    infer _,
                    infer Value
                >
                    ? { latest: ValueRef<Value>; all: ValueRef<Value>[] }
                    : never;
            } = {};

            this.by = {};
            this.in = {};

            Object.defineProperty(this, "co", {
                value: {
                    id: raw.id as unknown as ID<this>,
                    type: "CoStream",
                    raw,
                    loadedAs: controlledAccountFromNode(raw.core.node),
                    refs: {
                        by: byRefs,
                        in: inRefs,
                    },
                },
            });

            if (init !== undefined) {
                for (const item of init) {
                    this.pushItem(item);
                }
            }

            this.updateEntries();
        }

        private updateEntries() {
            const self = this;
            const raw = this.co.raw;
            const loadedAs = this.co.loadedAs;
            const refs = this.co.refs;

            if (itemIsCoValue) {
                for (const accountID of this.co.raw.accounts() as unknown as Set<
                    ID<Account>
                >) {
                    if (Object.hasOwn(refs.by, accountID)) continue;
                    Object.defineProperty(refs.by, accountID, {
                        get() {
                            const rawId = raw.lastItemBy(
                                accountID as unknown as AccountID
                            )?.value;
                            return new ValueRef(
                                rawId as unknown as ID<Schema.Schema.To<Item>>,
                                loadedAs,
                                itemSchema
                            );
                        },
                    });

                    Object.defineProperty(this.by, accountID, {
                        get() {
                            return refs.by[accountID]?.accessFrom(self);
                        },
                    });
                }

                for (const sessionID of raw.sessions() as unknown as Set<SessionID>) {
                    if (Object.hasOwn(refs.in, sessionID)) continue;
                    Object.defineProperty(refs.in, sessionID, {
                        get() {
                            const rawId = raw.lastItemIn(
                                sessionID as unknown as SessionID
                            )?.value;
                            return new ValueRef(
                                rawId as unknown as ID<Schema.Schema.To<Item>>,
                                loadedAs,
                                itemSchema
                            );
                        },
                    });

                    Object.defineProperty(this.in, sessionID, {
                        get() {
                            return refs.in[sessionID]?.accessFrom(self);
                        },
                    });
                }
            } else {
                for (const accountID of raw.accounts() as unknown as Set<
                    ID<Account>
                >) {
                    if (Object.hasOwn(this.by, accountID)) continue;
                    Object.defineProperty(this.by, accountID, {
                        get() {
                            const rawItem = raw.lastItemBy(
                                accountID as unknown as AccountID
                            )?.value;
                            return rawItem && decodeItem(rawItem);
                        },
                    });
                }

                for (const sessionID of raw.sessions() as unknown as Set<SessionID>) {
                    if (Object.hasOwn(this.in, sessionID)) continue;
                    Object.defineProperty(this.in, sessionID, {
                        get() {
                            const rawItem = raw.lastItemIn(
                                sessionID as unknown as SessionID
                            )?.value;
                            return rawItem && decodeItem(rawItem);
                        },
                    });
                }
            }
        }

        static fromRaw(raw: RawCoStream) {
            return new CoStreamOfItem(undefined, { fromRaw: raw });
        }

        push(...items: Schema.Schema.To<Item>[]) {
            for (const item of items) {
                this.pushItem(item);
            }
            this.updateEntries();
        }

        private pushItem(item: Schema.Schema.To<Item>) {
            if (itemIsCoValue) {
                this.co.raw.push(item.co.id);
            } else {
                this.co.raw.push(encodeItem(item));
            }
        }

        toJSON() {
            return {
                by: Object.fromEntries(
                    Object.entries(this.by).map(([key, value]) => [
                        key,
                        value &&
                        typeof value === "object" &&
                        "toJSON" in value &&
                        typeof value.toJSON === "function"
                            ? value.toJSON()
                            : value,
                    ])
                ),
                in: Object.fromEntries(
                    Object.entries(this.in).map(([key, value]) => [
                        key,
                        value &&
                        typeof value === "object" &&
                        "toJSON" in value &&
                        typeof value.toJSON === "function"
                            ? value.toJSON()
                            : value,
                    ])
                ),
                co: {
                    id: this.co.id,
                    type: "CoStream",
                },
            };
        }

        [inspect]() {
            return this.toJSON();
        }
    }

    return CoStreamOfItem as CoStreamSchema<Self, Item>;
}

export function CoStreamOf<Self>() {
    return function <Item>(itemSchema: Item) {
        return CoStreamOfHelper<Self, Item>(itemSchema);
    };
}

class BinaryCoStreamImplClass implements BinaryCoStream {
    constructor(
        init: [] | undefined,
        options: {
            owner: Account | Group;
        }
    ) {}

    static load(
        id: ID<BinaryCoStreamImplClass>,
        options: { as: Account; onProgress?: (progress: number) => void }
    ): Promise<BinaryCoStreamImplClass | "unavailable"> {}

    getChunks(options?: {
        allowUnfinished?: boolean;
    }): BinaryStreamInfo & { chunks: Uint8Array[]; finished: boolean } {}

    start(options: BinaryStreamInfo): void {}

    push(data: Uint8Array): void {}

    end(): void {}
}

export const BinaryCoStreamImpl =
    BinaryCoStreamImplClass satisfies BinaryCoStreamSchema;
