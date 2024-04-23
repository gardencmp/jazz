import type {
    AccountID,
    AgentID,
    BinaryStreamInfo,
    CojsonInternalTypes,
    JsonValue,
    RawBinaryCoStream,
    RawCoStream,
    SessionID,
} from "cojson";
import { cojsonInternals } from "cojson";
import type {
    CoValue,
    ValidItem,
    Schema,
    SchemaFor,
    Group,
    ID,
    Me,
    IfCo,
} from "../internal.js";
import {
    ItemsSym,
    Account,
    CoValueBase,
    Ref,
    inspect,
    co,
    InitValues,
    SchemaInit,
    isRefEncoded,
} from "../internal.js";
import { Schema as EffectSchema } from "@effect/schema";

export type CoStreamEntry<Item> = SingleCoStreamEntry<Item> & {
    all: IterableIterator<SingleCoStreamEntry<Item>>;
};

export type SingleCoStreamEntry<Item> = {
    value: NonNullable<Item> extends CoValue ? NonNullable<Item> | null : Item;
    ref: NonNullable<Item> extends CoValue ? Ref<NonNullable<Item>> : never;
    by?: Account | null;
    madeAt: Date;
    tx: CojsonInternalTypes.TransactionID;
};

export class CoStream<Item extends ValidItem<Item, "CoStream"> = any>
    extends CoValueBase
    implements CoValue<"CoStream", RawCoStream>
{
    static Of<Item extends ValidItem<Item, "CoStream"> = any>(
        item: IfCo<Item, Item>
    ): typeof CoStream<Item> {
        return class CoStreamOf extends CoStream<Item> {
            [co.items] = item;
        };
    }

    declare id: ID<this>;
    declare _type: "CoStream";
    static {
        this.prototype._type = "CoStream";
    }
    declare _raw: RawCoStream;

    /** @internal This is only a marker type and doesn't exist at runtime */
    [ItemsSym]!: Item;
    static _schema: any;
    get _schema(): {
        [ItemsSym]: SchemaFor<Item>;
    } {
        return (this.constructor as typeof CoStream)._schema;
    }

    [key: ID<Account>]: CoStreamEntry<Item>;

    get byMe(): CoStreamEntry<Item> | undefined {
        return this[this._loadedAs.id];
    }
    perSession!: {
        [key: SessionID]: CoStreamEntry<Item>;
    };
    get inCurrentSession(): CoStreamEntry<Item> | undefined {
        return this.perSession[this._loadedAs.sessionID];
    }

    [InitValues]?: {
        init?: Item[];
        owner: Account | Group;
    };

    constructor(_init: undefined, options: { fromRaw: RawCoStream });
    constructor(init: Item[], options: { owner: Account | Group });
    constructor(
        init: Item[] | undefined,
        options: { owner: Account | Group } | { fromRaw: RawCoStream }
    ) {
        super();

        if ("fromRaw" in options) {
            Object.defineProperties(this, {
                id: {
                    value: options.fromRaw.id,
                    enumerable: false,
                },
                _raw: { value: options.fromRaw, enumerable: false },
            });
        } else {
            this[InitValues] = {
                init,
                owner: options.owner,
            };
        }

        return new Proxy(this, CoStreamProxyHandler as ProxyHandler<this>);
    }

    push(...items: Item[]) {
        for (const item of items) {
            this.pushItem(item);
        }
    }

    private pushItem(item: Item) {
        const itemDescriptor = this._schema[ItemsSym] as Schema;

        if (itemDescriptor === "json") {
            this._raw.push(item as JsonValue);
        } else if ("encoded" in itemDescriptor) {
            this._raw.push(
                EffectSchema.encodeSync(itemDescriptor.encoded)(item)
            );
        } else if (isRefEncoded(itemDescriptor)) {
            this._raw.push((item as unknown as CoValue).id);
        }
    }

    toJSON() {
        const itemDescriptor = this._schema[ItemsSym] as Schema;
        const mapper =
            itemDescriptor === "json"
                ? (v: unknown) => v
                : "encoded" in itemDescriptor
                  ? EffectSchema.encodeSync(itemDescriptor.encoded)
                  : (v: unknown) => v && (v as CoValue).id;

        return {
            id: this.id,
            _type: this._type,
            ...Object.fromEntries(
                Object.entries(this).map(([account, entry]) => [
                    account,
                    mapper(entry.value),
                ])
            ),
            in: Object.fromEntries(
                Object.entries(this.perSession).map(([session, entry]) => [
                    session,
                    mapper(entry.value),
                ])
            ),
        };
    }

    [inspect]() {
        return this.toJSON();
    }

    static schema<V extends CoStream>(
        this: { new (...args: any): V } & typeof CoStream,
        def: { [ItemsSym]: V["_schema"][ItemsSym] }
    ) {
        this._schema ||= {};
        Object.assign(this._schema, def);
    }
}

function entryFromRawEntry<Item>(
    accessFrom: CoValue,
    rawEntry: {
        by: AccountID | AgentID;
        tx: CojsonInternalTypes.TransactionID;
        at: Date;
        value: JsonValue;
    },
    loadedAs: Account & Me,
    accountID: ID<Account> | undefined,
    itemField: Schema
) {
    return {
        get value(): Item | undefined {
            if (itemField === "json") {
                return rawEntry.value as Item;
            } else if ("encoded" in itemField) {
                return EffectSchema.decodeSync(itemField.encoded)(
                    rawEntry.value
                );
            } else if (isRefEncoded(itemField)) {
                return this.ref?.accessFrom(accessFrom) as Item;
            }
        },
        get ref() {
            if (itemField !== "json" && isRefEncoded(itemField)) {
                const rawId = rawEntry.value;
                return new Ref(
                    rawId as unknown as ID<CoValue>,
                    loadedAs,
                    itemField
                );
            }
        },
        get by() {
            return (
                accountID &&
                new Ref<Account>(
                    accountID as unknown as ID<Account>,
                    loadedAs,
                    Account
                )?.accessFrom(accessFrom)
            );
        },
        madeAt: rawEntry.at,
        tx: rawEntry.tx,
    };
}

function init(stream: CoStream) {
    const init = stream[InitValues];
    if (!init) return;

    const raw = init.owner._raw.createStream();

    Object.defineProperties(stream, {
        id: {
            value: raw.id,
            enumerable: false,
        },
        _raw: { value: raw, enumerable: false },
    });

    if (init.init) {
        stream.push(...init.init);
    }

    delete stream[InitValues];
}

export const CoStreamProxyHandler: ProxyHandler<CoStream> = {
    get(target, key, receiver) {
        if (typeof key === "string" && key.startsWith("co_")) {
            const rawEntry = target._raw.lastItemBy(key as AccountID);

            if (!rawEntry) return;
            const entry = entryFromRawEntry(
                receiver,
                rawEntry,
                target._loadedAs,
                key as unknown as ID<Account>,
                target._schema[ItemsSym]
            );

            Object.defineProperty(entry, "all", {
                get: () => {
                    const allRawEntries = target._raw.itemsBy(key as AccountID);
                    return (function* () {
                        const rawEntry = allRawEntries.next();
                        if (rawEntry.done) return;
                        yield entryFromRawEntry(
                            receiver,
                            rawEntry.value,
                            target._loadedAs,
                            key as unknown as ID<Account>,
                            target._schema[ItemsSym]
                        );
                    })() satisfies IterableIterator<SingleCoStreamEntry<any>>;
                },
            });

            return entry;
        } else if (key === "perSession") {
            return new Proxy(receiver, CoStreamPerSessionProxyHandler);
        } else {
            return Reflect.get(target, key, receiver);
        }
    },
    set(target, key, value, receiver) {
        if (
            key === ItemsSym &&
            typeof value === "object" &&
            SchemaInit in value
        ) {
            (target.constructor as typeof CoStream)._schema ||= {};
            (target.constructor as typeof CoStream)._schema[ItemsSym] =
                value[SchemaInit];
            init(target);
            return true;
        } else {
            return Reflect.set(target, key, value, receiver);
        }
    },
    defineProperty(target, key, descriptor) {
        if (
            descriptor.value &&
            key === ItemsSym &&
            typeof descriptor.value === "object" &&
            SchemaInit in descriptor.value
        ) {
            (target.constructor as typeof CoStream)._schema ||= {};
            (target.constructor as typeof CoStream)._schema[ItemsSym] =
                descriptor.value[SchemaInit];
            init(target);
            return true;
        } else {
            return Reflect.defineProperty(target, key, descriptor);
        }
    },
    ownKeys(target) {
        const keys = Reflect.ownKeys(target);

        for (const accountID of target._raw.accounts()) {
            keys.push(accountID);
        }

        return keys;
    },
    getOwnPropertyDescriptor(target, key) {
        if (typeof key === "string" && key.startsWith("co_")) {
            return {
                configurable: true,
                enumerable: true,
                writable: false,
            };
        } else {
            return Reflect.getOwnPropertyDescriptor(target, key);
        }
    },
};

const CoStreamPerSessionProxyHandler: ProxyHandler<CoStream> = {
    get(target, key, receiver) {
        if (typeof key === "string" && key.includes("session")) {
            const sessionID = key as SessionID;
            const rawEntry = target._raw.lastItemIn(sessionID);

            if (!rawEntry) return;
            const by = cojsonInternals.accountOrAgentIDfromSessionID(sessionID);

            const entry = entryFromRawEntry(
                target,
                rawEntry,
                target._loadedAs,
                cojsonInternals.isAccountID(by)
                    ? (by as unknown as ID<Account>)
                    : undefined,
                target._schema[ItemsSym]
            );

            Object.defineProperty(entry, "all", {
                get: () => {
                    const allRawEntries = target._raw.itemsIn(sessionID);
                    return (function * () {
                        const rawEntry = allRawEntries.next();
                        if (rawEntry.done) return;
                        yield entryFromRawEntry(
                            receiver,
                            rawEntry.value,
                            target._loadedAs,
                            cojsonInternals.isAccountID(by)
                                ? (by as unknown as ID<Account>)
                                : undefined,
                            target._schema[ItemsSym]
                        );
                    })() satisfies IterableIterator<SingleCoStreamEntry<any>>
                }
            });

            return entry;
        } else {
            return Reflect.get(target, key, receiver);
        }
    },
};

export class BinaryCoStream
    extends CoValueBase
    implements CoValue<"BinaryCoStream", RawBinaryCoStream>
{
    declare id: ID<this>;
    declare _type: "BinaryCoStream";
    declare _raw: RawBinaryCoStream;

    constructor(
        _init: [] | undefined,
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
            const rawOwner = options.owner._raw;
            raw = rawOwner.createBinaryStream();
        }

        Object.defineProperties(this, {
            id: {
                value: raw.id,
                enumerable: false,
            },
            _raw: { value: raw, enumerable: false },
        });
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

    toJSON() {
        return {
            id: this.id,
            _type: this._type,
            ...this.getChunks(),
        };
    }

    [inspect]() {
        return this.toJSON();
    }
}
