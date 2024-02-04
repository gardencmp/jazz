import {
    RawCoStream as RawCoStream,
    RawBinaryCoStream as RawBinaryCoStream,
    RawAccount as RawAccount,
    CoValueCore,
    SessionID,
    CojsonInternalTypes,
    AccountID,
    CoID,
} from "cojson";
import { ControlledAccount } from "./account.js";
import {
    Account,
    CoValue,
    CoValueBase,
    CoValueMetaBase,
    CoValueSchemaBase,
    Group,
    ID,
    RawType,
    SimpleAccount,
    subscriptionScopeSym,
} from "./index.js";
import { Schema } from "./schema.js";
import { Chunk, Effect, Stream } from "effect";
import { CoValueUnavailableError, UnknownCoValueLoadError } from "./errors.js";
import { ValueRef } from "./valueRef.js";
import { SubscriptionScope } from "./subscriptionScope.js";
import { isCoValueSchema } from "./guards.js";
import { ControlledAccountCtx } from "./services.js";
import { CoStreamItem } from "cojson/src/coValues/coStream.js";

export interface CoStreamEntry<Item extends Schema = Schema> {
    value: Item["_Value"];
    ref: Item["_Value"] extends CoValue ? ValueRef<Item["_Value"]> : undefined;
    tx: CojsonInternalTypes.TransactionID;
    at: Date;
}

export interface CoStreamStream<Item extends Schema = Schema> {
    last?: CoStreamEntry<Item>;
    all: CoStreamEntry<Item>[];
}

export interface CoStream<Item extends Schema = Schema> extends CoValueBase {
    /** @category Collaboration */
    id: ID<CoStream<Item>>;
    /** @category Collaboration */
    meta: CoStreamMeta;
    _raw: RawCoStream<RawType<Item>>;

    bySession: [SessionID, CoStreamStream<Item>][];
    byAccount: [AccountID, CoStreamStream<Item>][];

    push(item: Item["_Value"]): void;
}

class CoStreamMeta implements CoValueMetaBase {
    owner: Account | Group;
    core: CoValueCore;
    loadedAs: ControlledAccount;

    constructor(raw: RawCoStream) {
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = Group.fromRaw(rawOwner);
        }
        this.core = raw.core;
    }
}

export interface CoStreamSchema<Item extends Schema = Schema>
    extends Schema<CoStream<Item>>,
        CoValueSchemaBase<CoStream<Item>, RawCoStream<RawType<Item>>> {
    _Type: "costream";
    _Item: Item;

    new (options: { owner: Account | Group }): CoStream<Item>;
    new (options: { fromRaw: RawType<CoStreamSchema<Item>> }): CoStream<Item>;

    fromRaw(
        raw: RawCoStream<RawType<Item>>,
        onGetRef?: (id: ID<CoValue>) => void
    ): CoStream<Item>;

    load(
        id: ID<CoStream<Item>>,
        { as }: { as: ControlledAccount }
    ): Promise<CoStream<Item>>;
}

export function isCoStreamSchema(value: unknown): value is CoStreamSchema {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "costream"
    );
}

export function isCoStream(value: unknown): value is CoStream {
    return (
        typeof value === "object" &&
        value !== null &&
        isCoStreamSchema(value.constructor) &&
        "id" in value
    );
}

export function CoStreamOf<Item extends Schema>(
    ItemSchema: Item
): CoStreamSchema<Item> {
    class CoStreamStreamImpl implements CoStreamStream<Item> {
        constructor() {

        }

        get last(): CoStreamEntry<Item> {
            const rawItem = raw.lastItemIn(sessionID);

            if (!rawItem) return;

                    let value;
                    let ref;

                    if (isCoValueSchema(ItemSchema)) {
                        ref = new ValueRef(rawItem.value, ItemSchema, as: );
                        value = ItemSchema.fromRaw(rawItem.value);
                    } else {
                        value = rawItem.value;
                    }
        }

        get all(): CoStreamEntry<Item>[] {

        }
    }

    class CoStreamSchemaForItem {
        static _Type = "costream" as const;
        static _RawValue: RawCoStream<RawType<Item>>;
        static _Item = ItemSchema;
        static _Value: CoStream<Item>;

        _raw: RawCoStream<RawType<Item>>;
        id: ID<CoStream<Item>>;
        meta: CoStreamMeta;
        [subscriptionScopeSym]?: SubscriptionScope;

        constructor(options: { owner: Account | Group });
        constructor(options: { fromRaw: RawCoStream<RawType<Item>> });
        constructor(
            options:
                | { owner: Account | Group }
                | { fromRaw: RawCoStream<RawType<Item>> }
        ) {
            let raw: RawCoStream<RawType<Item>>;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
            } else {
                const rawOwner = options.owner._raw;
                raw = rawOwner.createStream<RawCoStream<RawType<Item>>>();
            }

            this._raw = raw;
            this.id = raw.id as unknown as ID<CoStream<Item>>;
            this.meta = new CoStreamMeta(raw);
        }

        static fromRaw(raw: RawCoStream<RawType<Item>>): CoStream<Item> {
            return new CoStreamSchemaForItem({ fromRaw: raw });
        }

        static load(
            id: ID<CoStream<Item>>,
            { as }: { as: ControlledAccount }
        ): Promise<CoStream<Item>> {
            return Effect.runPromise(
                Effect.provideService(
                    this.loadEf(id),
                    ControlledAccountCtx,
                    ControlledAccountCtx.of(as)
                )
            );
        }

        static loadEf(
            id: ID<CoStream<Item>>
        ): Effect.Effect<
            ControlledAccount,
            CoValueUnavailableError | UnknownCoValueLoadError,
            CoStream<Item>
        > {
            return Effect.gen(function* ($) {
                const as = yield* $(ControlledAccountCtx);
                const raw = yield* $(
                    Effect.tryPromise({
                        try: () =>
                            as._raw.core.node.load(
                                id as unknown as CoID<
                                    RawCoStream<RawType<Item>>
                                >
                            ),
                        catch: (cause) =>
                            new UnknownCoValueLoadError({ cause }),
                    })
                );

                if (raw === "unavailable") {
                    return yield* $(Effect.fail(new CoValueUnavailableError()));
                }

                return CoStreamSchemaForItem.fromRaw(raw);
            });
        }

        static subscribeEf(
            id: ID<CoStream<Item>>
        ): Stream.Stream<
            ControlledAccountCtx,
            CoValueUnavailableError | UnknownCoValueLoadError,
            CoStream<Item>
        > {
            throw new Error(
                "TODO: implement somehow with Scope and Stream.asyncScoped"
            );
        }

        static subscribe(
            id: ID<CoStream<Item>>,
            { as }: { as: ControlledAccount },
            onUpdate: (value: CoStream<Item>) => void
        ): () => void {
            let unsub: () => void = () => {
                stopImmediately = true;
            };
            let stopImmediately = false;
            void this.load(id, { as }).then((value) => {
                unsub = value.subscribe(onUpdate);
                if (stopImmediately) {
                    unsub();
                }
            });

            return () => {
                unsub();
            };
        }

        subscribeEf(): Stream.Stream<never, never, CoStream<Item>> {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this;
            return Stream.asyncScoped((emit) =>
                Effect.gen(function* ($) {
                    const unsub = self.subscribe((value) => {
                        void emit(Effect.succeed(Chunk.of(value)));
                    });

                    yield* $(Effect.addFinalizer(() => Effect.sync(unsub)));
                })
            );
        }

        subscribe(listener: (newValue: CoStream<Item>) => void): () => void {
            const subscribable = CoStreamSchemaForItem.fromRaw(this._raw);
            const scope = new SubscriptionScope(subscribable, (scope) => {
                const updatedValue = CoStreamSchemaForItem.fromRaw(this._raw);
                updatedValue[subscriptionScopeSym] = scope;
                listener(updatedValue);
            });

            return () => {
                scope.unsubscribeAll();
            };
        }

        toJSON() {
            return {
                bySession: this.bySession.map(([sessionID, stream]) => [
                    sessionID,
                    stream.all.map((item) => item.value.toJSON()),
                ]),
            };
        }

        [Symbol.for("nodejs.util.inspect.custom")](
            _depth: number,
            _opts: unknown
        ) {
            return this.toJSON();
        }

        push(item: Item["_Value"]) {
            if (isCoValueSchema(ItemSchema)) {
                this._raw.push(item.id);
                const currentSessionID = this._raw.core.node.currentSessionID;
                // TODO: this might not be atomic?
                const refIdx =
                    currentSessionID +
                    "_" +
                    (this._raw.core.sessionLogs.get(currentSessionID)
                        ?.transactions.length || 0);
                this[subscriptionScopeSym]?.onRefRemovedOrReplaced(
                    this.id,
                    refIdx
                );
                this[subscriptionScopeSym]?.onRefAccessedOrSet(
                    this.id,
                    refIdx,
                    item?.id,
                    ItemSchema
                );
            } else {
                this._raw.push(item);
            }
        }

        get bySession(): [SessionID, CoStreamStream<Item>][] {
            return this._raw.sessions().map((sessionID) => [sessionID, new CoStreamStreamImpl()])
        }

        get byAccount(): [AccountID, CoStreamStream<Item>][] {
            return [...this._raw.accounts()].map((accountID) => [accountID, new CoStreamStreamImpl()])
        }
    }

    return CoStreamSchemaForItem as CoStreamSchema<Item>;
}

export interface BinaryCoStream extends CoValueBase {
    id: ID<BinaryCoStream>;
    meta: CoStreamMeta;
    _raw: RawBinaryCoStream;

    start(options: {
        mimeType?: string;
        totalSizeBytes?: number;
        fileName?: string;
    }): void;
    push(data: ArrayBuffer | ArrayBufferView): void;
    end(): void;

    getChunks(options?: { allowUnfinished?: boolean }): {
        chunks: Uint8Array[];
        mimeType?: string;
    };
}

class BinaryCoStreamMeta {
    owner: Account | Group;

    constructor(raw: RawBinaryCoStream) {
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = Group.fromRaw(rawOwner);
        }
    }
}

export interface BinaryCoStreamSchema<Item extends Schema = Schema>
    extends Schema<BinaryCoStream>,
        CoValueSchemaBase<BinaryCoStream, RawBinaryCoStream> {
    _Type: "binarycostream";

    new (options: { owner: Account | Group }): BinaryCoStream;

    fromRaw(
        raw: RawBinaryCoStream,
        onGetRef?: (id: ID<CoValue>) => void
    ): BinaryCoStream;

    load(
        id: ID<BinaryCoStream>,
        {
            as,
            onProgress,
        }: { as: ControlledAccount; onProgress?: (progress: number) => void }
    ): Promise<BinaryCoStream | undefined>;
}

export const BinaryCoStream = class BinaryCoStream implements BinaryCoStream {
    static _Type = "binarycostream" as const;
    static _Value: BinaryCoStream =
        "BinaryCoStream" as unknown as BinaryCoStream;
    static _RawValue: RawBinaryCoStream;
    id: ID<BinaryCoStream>;
    meta: BinaryCoStreamMeta;
    _raw: RawBinaryCoStream;

    constructor(
        options: { owner: Account | Group } | { fromRaw: RawBinaryCoStream }
    ) {
        let raw: RawBinaryCoStream;
        if ("fromRaw" in options) {
            raw = options.fromRaw;
        } else if (options.owner) {
            const rawOwner = options.owner._raw;
            raw = rawOwner.createBinaryStream();
        } else {
            throw new Error("Invalid options");
        }

        this._raw = raw;
        this.id = raw.id as unknown as ID<BinaryCoStream>;
        this.meta = new BinaryCoStreamMeta(raw);
    }

    static fromRaw(
        raw: RawBinaryCoStream,
        onGetRef?: (id: ID<CoValue>) => void
    ): BinaryCoStream {
        throw new Error("Method not implemented.");
    }

    static load(
        id: ID<BinaryCoStream>,
        {
            as,
            onProgress,
        }: { as: ControlledAccount; onProgress?: (progress: number) => void }
    ): Promise<BinaryCoStream | undefined> {
        throw new Error("Method not implemented.");
    }

    static loadEf(
        id: ID<BinaryCoStream>
    ): Effect.Effect<
        ControlledAccount,
        CoValueUnavailableError | UnknownCoValueLoadError,
        BinaryCoStream
    > {
        throw new Error("Not implemented");
    }

    start(options: {
        mimeType?: string;
        totalSizeBytes?: number;
        fileName?: string;
    }) {
        throw new Error("Method not implemented.");
    }

    push(data: ArrayBuffer | ArrayBufferView) {
        throw new Error("Method not implemented.");
    }

    end() {
        throw new Error("Method not implemented.");
    }

    getChunks(options?: { allowUnfinished?: boolean }): {
        chunks: Uint8Array[];
        mimeType?: string;
    } {
        throw new Error("Method not implemented.");
    }
} satisfies BinaryCoStreamSchema;

export function isBinaryCoStreamSchema(
    value: unknown
): value is BinaryCoStreamSchema {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "binarycostream"
    );
}

export function isBinaryCoStream(value: unknown): value is BinaryCoStream {
    return (
        typeof value === "object" &&
        value !== null &&
        isBinaryCoStreamSchema(value.constructor) &&
        "id" in value
    );
}
