import {
    AccountID,
    AgentID,
    BinaryStreamInfo,
    CojsonInternalTypes,
    JsonValue,
    RawAccount,
    RawBinaryCoStream,
    RawCoStream,
    SessionID,
    cojsonInternals,
} from "cojson";
import {
    CoValue,
    CoValueSchema,
    ID,
    inspect,
} from "../../coValueInterfaces.js";
import { AnyAccount, ControlledAccount } from "../account/account.js";
import { AnyGroup } from "../group/group.js";
import {
    BinaryCoStream,
    BinaryCoStreamSchema,
    CoStream,
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
import { Account, controlledAccountFromNode } from "../account/accountOf.js";
import { Group } from "../group/groupOf.js";

export function CoStreamOf<
    Item extends SchemaWithOutput<CoValue> | SchemaWithOutput<JsonValue>,
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
            // eslint-disable-next-line prefer-rest-params
            return pipeArguments(this, arguments);
        }
        static type = "CoStream" as const;

        id!: ID<this>;
        _type!: "CoStream";
        _owner!: AnyAccount | AnyGroup;
        _raw!: RawCoStream;
        _loadedAs!: ControlledAccount;
        _schema!: typeof CoStreamOfItem;

        by: CoStream<Item>["by"];
        byMe: CoStream<Item>["byMe"];
        in: CoStream<Item>["in"];
        inCurrentSession: CoStream<Item>["inCurrentSession"];

        constructor(
            init: Schema.Schema.To<Item>[] | undefined,
            options: { owner: AnyAccount | AnyGroup } | { fromRaw: RawCoStream }
        ) {
            super();

            let raw: RawCoStream;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
            } else {
                const rawOwner = options.owner._raw;

                raw = rawOwner.createStream();
            }

            this.by = {} as CoStream<Item>["by"];
            this.in = {} as CoStream<Item>["in"];

            Object.defineProperties(this, {
                id: { value: raw.id, enumerable: false },
                _type: { value: "CoStream", enumerable: false },
                _owner: {
                    get: () =>
                        raw.group instanceof RawAccount
                            ? Account.fromRaw(raw.group)
                            : Group.fromRaw(raw.group),
                    enumerable: false,
                },
                _raw: { value: raw, enumerable: false },
                _loadedAs: {
                    get: () => controlledAccountFromNode(raw.core.node),
                    enumerable: false,
                },
                _schema: { value: this.constructor, enumerable: false },
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
            const raw = this._raw;
            const loadedAs = this._loadedAs;

            for (const accountID of this._raw.accounts() as unknown as Set<
                ID<AnyAccount>
            >) {
                Object.defineProperty(this.by, accountID, {
                    get() {
                        const rawEntry = raw.lastItemBy(
                            accountID as unknown as AccountID
                        );

                        if (!rawEntry) return;
                        return entryFromRawEntry(
                            self,
                            rawEntry,
                            loadedAs,
                            accountID
                        );
                    },
                    configurable: true,
                    enumerable: true,
                });
            }
            Object.defineProperty(this, "byMe", {
                get() {
                    return self.by[loadedAs.id];
                },
                enumerable: false,
                configurable: true,
            });

            for (const sessionID of raw.sessions() as unknown as Set<SessionID>) {
                Object.defineProperty(this.in, sessionID, {
                    get() {
                        const rawEntry = raw.lastItemIn(
                            sessionID as unknown as SessionID
                        );

                        if (!rawEntry) return;
                        const by =
                            cojsonInternals.accountOrAgentIDfromSessionID(
                                sessionID
                            );
                        return entryFromRawEntry(
                            self,
                            rawEntry,
                            loadedAs,
                            cojsonInternals.isAccountID(by)
                                ? (by as unknown as ID<AnyAccount>)
                                : undefined
                        );
                    },
                    configurable: true,
                    enumerable: true,
                });
            }
            Object.defineProperty(this, "inCurrentSession", {
                get() {
                    return self.in[loadedAs.sessionID];
                },
                enumerable: false,
                configurable: true,
            });
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
                this._raw.push(item.id);
            } else {
                this._raw.push(encodeItem(item));
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
                    id: this.id,
                    type: "CoStream",
                },
            };
        }

        [inspect]() {
            return this.toJSON();
        }
    }

    return {
        HINT: (_: never) =>
            "Remember to do `class SubClass extends Co.stream(...)👉.as<SubClass>()👈 {}`" as const,
        as<SubClass>() {
            return CoStreamOfItem as unknown as CoStreamSchema<SubClass, Item>;
        },
    };

    function entryFromRawEntry(
        accessFrom: CoValue,
        rawEntry: {
            by: AccountID | AgentID;
            tx: CojsonInternalTypes.TransactionID;
            at: Date;
            value: JsonValue;
        },
        loadedAs: ControlledAccount,
        accountID: ID<AnyAccount> | undefined
    ) {
        return {
            get value(): Schema.Schema.To<Item> | undefined {
                if (itemIsCoValue) {
                    return this.ref?.accessFrom(accessFrom);
                } else {
                    return decodeItem(rawEntry.value);
                }
            },
            get ref() {
                if (itemIsCoValue) {
                    const rawId = rawEntry.value;
                    return new ValueRef(
                        rawId as unknown as ID<Schema.Schema.To<Item>>,
                        loadedAs,
                        itemSchema
                    );
                }
            },
            get by() {
                return (
                    accountID &&
                    new ValueRef(
                        accountID as unknown as ID<AnyAccount>,
                        loadedAs,
                        Account
                    )?.accessFrom(accessFrom)
                );
            },
            madeAt: rawEntry.at,
            tx: rawEntry.tx,
        };
    }
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
        BinaryCoStream,
        BinaryCoStream,
        never
    >[Schema.TypeId];
    static pipe() {
        // eslint-disable-next-line prefer-rest-params
        return pipeArguments(this, arguments);
    }
    static type = "BinaryCoStream" as const;

    id!: ID<this>;
    _type!: "BinaryCoStream";
    _owner!: AnyAccount | AnyGroup;
    _raw!: RawBinaryCoStream;
    _loadedAs!: ControlledAccount;
    _schema!: typeof BinaryCoStreamImplClass;

    constructor(
        init: [] | undefined,
        options:
            | {
                  owner: AnyAccount | AnyGroup;
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
            const rawOwner = options.owner._raw;

            raw = rawOwner.createBinaryStream();
        }

        Object.defineProperties(this, {
            id: { value: raw.id, enumerable: false },
            _type: { value: "BinaryCoStream", enumerable: false },
            _owner: {
                get: () =>
                    raw.group instanceof RawAccount
                        ? Account.fromRaw(raw.group)
                        : Group.fromRaw(raw.group),
                enumerable: false,
            },
            _raw: { value: raw, enumerable: false },
            _loadedAs: {
                get: () => controlledAccountFromNode(raw.core.node),
                enumerable: false,
            },
            _schema: { value: this.constructor, enumerable: false },
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
        return this._raw.getBinaryChunks(options?.allowUnfinished);
    }

    start(options: BinaryStreamInfo): void {
        this._raw.startBinaryStream(options);
    }

    push(data: Uint8Array): void {
        this._raw.pushBinaryStreamChunk(data);
    }

    end(): void {
        this._raw.endBinaryStream();
    }

    toJSON(): object | any[] {
        return {
            ...this.getChunks(),
            co: {
                id: this.id,
                type: "BinaryCoStream",
            },
        };
    }

    [inspect]() {
        return this.toJSON();
    }
}

export const BinaryCoStreamImpl =
    BinaryCoStreamImplClass as BinaryCoStreamSchema;
