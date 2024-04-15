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
    EnsureItemNullable,
    FieldDescriptor,
    FieldDescriptorFor,
    Group,
    ID,
    Me,
} from "../internal.js";
import { Account, CoValueBase, ValueRef, inspect } from "../internal.js";
import { Schema } from "@effect/schema";

export type CoStreamEntry<Item> = {
    value: NonNullable<Item> extends CoValue ? NonNullable<Item> | null : Item;
    ref?: NonNullable<Item> extends CoValue
        ? ValueRef<NonNullable<Item>>
        : never;
    by?: Account;
    madeAt: Date;
    tx: CojsonInternalTypes.TransactionID;
};

export class CoStream<Item extends EnsureItemNullable<Item, "Co.Stream"> = any>
    extends CoValueBase
    implements CoValue<"CoStream", RawCoStream>
{
    id!: ID<this>;
    _type!: "CoStream";
    static {
        this.prototype._type = "CoStream";
    }
    _raw!: RawCoStream;

    /** @internal This is only a marker type and doesn't exist at runtime */
    _item!: Item;
    static _schema: any;
    get _schema(): {
        _item: FieldDescriptorFor<Item>;
    } {
        return (this.constructor as typeof CoStream)._schema;
    }

    by: {
        [key: ID<Account>]: CoStreamEntry<Item>;
    } = {};
    get byMe(): CoStreamEntry<Item> | undefined {
        return this.by[this._loadedAs.id];
    }
    in: {
        [key: SessionID]: CoStreamEntry<Item>;
    } = {};
    get inCurrentSession(): CoStreamEntry<Item> | undefined {
        return this.in[this._loadedAs.sessionID];
    }

    constructor(_init: undefined, options: { fromRaw: RawCoStream });
    constructor(init: Item[], options: { owner: Account | Group });
    constructor(
        init: Item[] | undefined,
        options: { owner: Account | Group } | { fromRaw: RawCoStream }
    ) {
        super();

        let raw: RawCoStream;

        if ("fromRaw" in options) {
            raw = options.fromRaw;
        } else {
            const rawOwner = options.owner._raw;

            raw = rawOwner.createStream();
        }

        Object.defineProperties(this, {
            id: {
                value: raw.id,
                enumerable: false,
            },
            _raw: { value: raw, enumerable: false },
        });

        if (init !== undefined) {
            for (const item of init) {
                this.pushItem(item);
            }
        }

        this.updateEntries();
    }

    private updateEntries() {
        for (const accountID of this._raw.accounts()) {
            Object.defineProperty(this.by, accountID, {
                get: () => {
                    const rawEntry = this._raw.lastItemBy(accountID);

                    if (!rawEntry) return;
                    return entryFromRawEntry(
                        this,
                        rawEntry,
                        this._loadedAs,
                        accountID as unknown as ID<Account>,
                        this._schema._item
                    );
                },
                configurable: true,
                enumerable: true,
            });
        }

        for (const sessionID of this._raw.sessions()) {
            Object.defineProperty(this.in, sessionID, {
                get: () => {
                    const rawEntry = this._raw.lastItemIn(
                        sessionID as unknown as SessionID
                    );

                    if (!rawEntry) return;
                    const by =
                        cojsonInternals.accountOrAgentIDfromSessionID(
                            sessionID
                        );
                    return entryFromRawEntry(
                        this,
                        rawEntry,
                        this._loadedAs,
                        cojsonInternals.isAccountID(by)
                            ? (by as unknown as ID<Account>)
                            : undefined,
                        this._schema._item
                    );
                },
                configurable: true,
                enumerable: true,
            });
        }
    }

    push(...items: Item[]) {
        for (const item of items) {
            this.pushItem(item);
        }
        this.updateEntries();
    }

    private pushItem(item: Item) {
        const itemDescriptor = this._schema._item as FieldDescriptor;

        if (itemDescriptor === "json") {
            this._raw.push(item as JsonValue);
        } else if ("encoded" in itemDescriptor) {
            this._raw.push(Schema.encodeSync(itemDescriptor.encoded)(item));
        } else if ("ref" in itemDescriptor) {
            this._raw.push((item as unknown as CoValue).id);
        }
    }

    toJSON() {
        const itemDescriptor = this._schema._item as FieldDescriptor;
        const mapper =
            itemDescriptor === "json"
                ? (v: unknown) => v
                : "encoded" in itemDescriptor
                  ? Schema.encodeSync(itemDescriptor.encoded)
                  : (v: unknown) => v && (v as CoValue).id;

        return {
            id: this.id,
            _type: this._type,
            by: Object.fromEntries(
                Object.entries(this.by).map(([account, entry]) => [
                    account,
                    mapper(entry.value),
                ])
            ),
            in: Object.fromEntries(
                Object.entries(this.in).map(([session, entry]) => [
                    session,
                    mapper(entry.value),
                ])
            ),
        };
    }

    [inspect]() {
        return this.toJSON();
    }

    static encoding<V extends CoStream>(
        this: { new (...args: any): V } & typeof CoStream,
        def: { _item: V["_schema"]["_item"] }
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
    itemField: FieldDescriptor
) {
    return {
        get value(): Item | undefined {
            if (itemField === "json") {
                return rawEntry.value as Item;
            } else if ("encoded" in itemField) {
                return Schema.decodeSync(itemField.encoded)(rawEntry.value);
            } else if ("ref" in itemField) {
                return this.ref?.accessFrom(accessFrom) as Item;
            }
        },
        get ref() {
            if (itemField !== "json" && "ref" in itemField) {
                const rawId = rawEntry.value;
                return new ValueRef(
                    rawId as unknown as ID<CoValue>,
                    loadedAs,
                    itemField.ref()
                );
            }
        },
        get by() {
            return (
                accountID &&
                new ValueRef(
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

export class BinaryCoStream
    extends CoValueBase
    implements CoValue<"BinaryCoStream", RawBinaryCoStream>
{
    id!: ID<this>;
    _type!: "BinaryCoStream";
    _raw!: RawBinaryCoStream;

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
