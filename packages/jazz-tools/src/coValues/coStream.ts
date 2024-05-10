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
import { MAX_RECOMMENDED_TX_SIZE, cojsonInternals } from "cojson";
import type {
    CoValue,
    Schema,
    SchemaFor,
    Group,
    ID,
    Me,
    IfCo,
    ClassOf,
    UnCo,
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
import { encodeSync, decodeSync } from "@effect/schema/Schema";

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

/** @category CoValues */
export class CoStream<Item = any>
    extends CoValueBase
    implements CoValue<"CoStream", RawCoStream>
{
    static Of<Item>(item: IfCo<Item, Item>): typeof CoStream<Item> {
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

    [InitValues]?: any;

    constructor(
        options:
            | { init: Item[]; owner: Account | Group }
            | { fromRaw: RawCoStream }
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
                init: options.init,
                owner: options.owner,
            };
        }

        return new Proxy(this, CoStreamProxyHandler as ProxyHandler<this>);
    }

    static create<S extends CoStream>(
        this: ClassOf<S>,
        init: S extends CoStream<infer Item> ? UnCo<Item>[] : never,
        options: { owner: Account | Group }
    ) {
        return new this({ init, owner: options.owner });
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
            this._raw.push(encodeSync(itemDescriptor.encoded)(item));
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
                  ? encodeSync(itemDescriptor.encoded)
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
): Omit<CoStreamEntry<Item>, "all"> {
    return {
        get value(): NonNullable<Item> extends CoValue
            ? (CoValue & Item) | null
            : Item {
            if (itemField === "json") {
                return rawEntry.value as NonNullable<Item> extends CoValue
                    ? (CoValue & Item) | null
                    : Item;
            } else if ("encoded" in itemField) {
                return decodeSync(itemField.encoded)(rawEntry.value);
            } else if (isRefEncoded(itemField)) {
                return this.ref?.accessFrom(
                    accessFrom
                ) as NonNullable<Item> extends CoValue
                    ? (CoValue & Item) | null
                    : Item;
            } else {
                throw new Error("Invalid item field schema");
            }
        },
        get ref(): NonNullable<Item> extends CoValue
            ? Ref<NonNullable<Item>>
            : never {
            if (itemField !== "json" && isRefEncoded(itemField)) {
                const rawId = rawEntry.value;
                return new Ref(
                    rawId as unknown as ID<CoValue>,
                    loadedAs,
                    itemField
                ) as NonNullable<Item> extends CoValue
                    ? Ref<NonNullable<Item>>
                    : never;
            } else {
                return undefined as never;
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
                        while (true) {
                            const rawEntry = allRawEntries.next();
                            if (rawEntry.done) return;
                            yield entryFromRawEntry(
                                receiver,
                                rawEntry.value,
                                target._loadedAs,
                                key as unknown as ID<Account>,
                                target._schema[ItemsSym]
                            );
                        }
                    })() satisfies IterableIterator<SingleCoStreamEntry<any>>;
                },
            });

            return entry;
        } else if (key === "perSession") {
            return new Proxy(
                {},
                CoStreamPerSessionProxyHandler(target, receiver)
            );
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

const CoStreamPerSessionProxyHandler = (
    innerTarget: CoStream,
    accessFrom: CoStream
): ProxyHandler<Record<string, never>> => ({
    get(_target, key, receiver) {
        if (typeof key === "string" && key.includes("session")) {
            const sessionID = key as SessionID;
            const rawEntry = innerTarget._raw.lastItemIn(sessionID);

            if (!rawEntry) return;
            const by = cojsonInternals.accountOrAgentIDfromSessionID(sessionID);

            const entry = entryFromRawEntry(
                accessFrom,
                rawEntry,
                innerTarget._loadedAs,
                cojsonInternals.isAccountID(by)
                    ? (by as unknown as ID<Account>)
                    : undefined,
                innerTarget._schema[ItemsSym]
            );

            Object.defineProperty(entry, "all", {
                get: () => {
                    const allRawEntries = innerTarget._raw.itemsIn(sessionID);
                    return (function* () {
                        while (true) {
                            const rawEntry = allRawEntries.next();
                            if (rawEntry.done) return;
                            yield entryFromRawEntry(
                                accessFrom,
                                rawEntry.value,
                                innerTarget._loadedAs,
                                cojsonInternals.isAccountID(by)
                                    ? (by as unknown as ID<Account>)
                                    : undefined,
                                innerTarget._schema[ItemsSym]
                            );
                        }
                    })() satisfies IterableIterator<SingleCoStreamEntry<any>>;
                },
            });

            return entry;
        } else {
            return Reflect.get(innerTarget, key, receiver);
        }
    },
    ownKeys() {
        return innerTarget._raw.sessions();
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
});

/** @category CoValues */
export class BinaryCoStream
    extends CoValueBase
    implements CoValue<"BinaryCoStream", RawBinaryCoStream>
{
    declare id: ID<this>;
    declare _type: "BinaryCoStream";
    declare _raw: RawBinaryCoStream;

    constructor(
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

    static create<S extends BinaryCoStream>(
        this: ClassOf<S>,
        options: { owner: Account | Group }
    ) {
        return new this(options);
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

    toBlob(options?: { allowUnfinished?: boolean }): Blob | undefined {
        const chunks = this.getChunks({
            allowUnfinished: options?.allowUnfinished,
        });

        if (!chunks) {
            return undefined;
        }

        return new Blob(chunks.chunks, { type: chunks.mimeType });
    }

    static async loadAsBlob(
        id: ID<BinaryCoStream>,
        options: {
            as: Account & Me;
            allowUnfinished?: boolean;
            onProgress?: (progress: number) => void;
        }
    ): Promise<Blob | undefined> {
        const stream = await this.load(id, {
            as: options.as,
            onProgress: options.onProgress,
        });

        return stream?.toBlob({
            allowUnfinished: options.allowUnfinished,
        });
    }

    static async createFromBlob(
        blob: Blob | File,
        options: {
            owner: Group | Account;
            onProgress?: (progress: number) => void;
        }
    ): Promise<BinaryCoStream> {
        const stream = this.create({ owner: options.owner });

        const start = Date.now();

        const data = new Uint8Array(await blob.arrayBuffer());
        stream.start({
            mimeType: blob.type,
            totalSizeBytes: blob.size,
            fileName: blob instanceof File ? blob.name : undefined,
        });
        const chunkSize = MAX_RECOMMENDED_TX_SIZE;

        let lastProgressUpdate = Date.now();

        for (let idx = 0; idx < data.length; idx += chunkSize) {
            stream.push(data.slice(idx, idx + chunkSize));

            if (Date.now() - lastProgressUpdate > 100) {
                options.onProgress?.(idx / data.length);
                lastProgressUpdate = Date.now();
            }

            await new Promise((resolve) => setTimeout(resolve, 0));
        }
        stream.end();
        const end = Date.now();

        console.debug(
            "Finished creating binary stream in",
            (end - start) / 1000,
            "s - Throughput in MB/s",
            (1000 * (blob.size / (end - start))) / (1024 * 1024)
        );
        options.onProgress?.(1);

        return stream;
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
