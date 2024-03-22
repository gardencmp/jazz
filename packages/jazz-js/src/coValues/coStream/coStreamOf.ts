import {
    AccountID,
    BinaryStreamInfo,
    JsonValue,
    RawBinaryCoStream,
    RawCoStream,
    SessionID,
} from "cojson";
import {
    CoValue,
    CoValueCo,
    CoValueSchema,
    ID,
    inspect,
} from "../../coValueInterfaces.js";
import { Account } from "../account/account.js";
import { Group } from "../group/group.js";
import {
    BinaryCoStream,
    BinaryCoStreamSchema,
    CoStreamCo,
    CoStreamSchema,
} from "./coStream.js";
import { CoValueCoImpl, SharedCoValueConstructor } from "../construction.js";
import { AST, Schema } from "@effect/schema";
import {
    constructorOfSchemaSym,
    propertyIsCoValueSchema,
} from "../resolution.js";
import { pipeArguments } from "effect/Pipeable";
import { ValueRef } from "../../refs.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";

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
            Self & CoStreamOfItem,
            Self & CoStreamOfItem,
            never
        >[Schema.TypeId];
        static pipe() {
            // eslint-disable-next-line prefer-rest-params
            return pipeArguments(this, arguments);
        }
        static type = "CoStream" as const;

        co!: CoStreamCo<this, Item>;

        by: {
            [key: ID<Account>]: Schema.Schema.To<Item>;
        };
        in: {
            [key: SessionID]: Schema.Schema.To<Item>;
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
                    ? ValueRef<Value>
                    : never;
            } = {};
            const inRefs: {
                [key: SessionID]: Item extends CoValueSchema<
                    infer _,
                    infer Value
                >
                    ? ValueRef<Value>
                    : never;
            } = {};

            this.by = {};
            this.in = {};

            Object.defineProperty(this, "co", {
                value: new CoValueCoImpl(
                    raw.id as unknown as ID<this>,
                    "CoStream",
                    raw,
                    this.constructor as CoStreamSchema<this, Item>,
                    {
                        by: byRefs,
                        in: inRefs,
                    }
                ) satisfies CoStreamCo<CoStreamOfItem, Item>,
            });

            if (init !== undefined) {
                for (const item of init) {
                    this.pushItem(item);
                }
            }

            this.updateEntries();
        }

        private updateEntries() {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
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
    return function <
        Item extends
            | CoValueSchema<any, CoValue<string, any>, string, any>
            | SchemaWithOutput<JsonValue>,
    >(itemSchema: Item) {
        return CoStreamOfHelper<Self, Item>(itemSchema);
    };
}

class BinaryCoStreamImplClass
    extends SharedCoValueConstructor
    implements BinaryCoStream
{
    static ast = AST.setAnnotation(
        Schema.instanceOf(this).ast,
        constructorOfSchemaSym,
        this
    );
    static [Schema.TypeId]: Schema.Schema.Variance<
        BinaryCoStreamImplClass,
        BinaryCoStreamImplClass,
        never
    >[Schema.TypeId];
    static pipe() {
        // eslint-disable-next-line prefer-rest-params
        return pipeArguments(this, arguments);
    }
    static type = "BinaryCoStream" as const;
    co!: CoValueCo<"BinaryCoStream", this, RawBinaryCoStream>;
    constructor(
        init: [] | undefined,
        options:
            | {
                  owner: Account | Group;
              }
            | {
                  fromRaw: RawBinaryCoStream;
              }
    ) {
        super();

        let raw: RawBinaryCoStream;

        if ("fromRaw" in options) {
            raw = options.fromRaw;
        } else {
            const rawOwner = options.owner.co.raw;

            raw = rawOwner.createBinaryStream();
        }

        Object.defineProperty(this, "co", {
            value: new CoValueCoImpl(
                raw.id as unknown as ID<this>,
                "BinaryCoStream",
                raw,
                this.constructor as BinaryCoStreamSchema,
                undefined
            ) satisfies CoValueCo<
                "BinaryCoStream",
                BinaryCoStream,
                RawBinaryCoStream
            >,
        });
    }

    static fromRaw(raw: RawBinaryCoStream) {
        return new BinaryCoStreamImplClass(undefined, { fromRaw: raw });
    }

    getChunks(options?: {
        allowUnfinished?: boolean;
    }):
        | (BinaryStreamInfo & { chunks: Uint8Array[]; finished: boolean })
        | undefined {
        return this.co.raw.getBinaryChunks(options?.allowUnfinished);
    }

    start(options: BinaryStreamInfo): void {
        this.co.raw.startBinaryStream(options);
    }

    push(data: Uint8Array): void {
        this.co.raw.pushBinaryStreamChunk(data);
    }

    end(): void {
        this.co.raw.endBinaryStream();
    }

    toJSON(): object | any[] {
        return {
            ...this.getChunks(),
            co: {
                id: this.co.id,
                type: "BinaryCoStream",
            },
        };
    }

    [inspect]() {
        return this.toJSON();
    }
}

export const BinaryCoStreamImpl =
    BinaryCoStreamImplClass satisfies BinaryCoStreamSchema;
