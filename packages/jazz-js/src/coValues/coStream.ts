import {
    RawCoStream as RawCoStream,
    RawAccount as RawAccount,
    CoValueCore,
    SessionID,
    CojsonInternalTypes,
    AccountID,
    CoID,
    RawControlledAccount,
    AgentID,
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
} from "../index.js";
import { Schema } from "../schema.js";
import { Chunk, Effect, Stream } from "effect";
import { CoValueUnavailableError, UnknownCoValueLoadError } from "../errors.js";
import { ValueRef } from "../valueRef.js";
import { SubscriptionScope } from "../subscriptionScope.js";
import { isCoValueSchema } from "../guards.js";
import { ControlledAccountCtx } from "../services.js";

export interface CoStreamEntry<Item extends Schema = Schema> {
    value: Item["_Value"] extends CoValue
        ? Item["_Value"] | undefined
        : Item["_Value"];
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

export class CoStreamMeta implements CoValueMetaBase {
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
        this.loadedAs = SimpleAccount.ControlledSchema.fromRaw(
            raw.core.node.account as RawControlledAccount
        );
    }
}

export interface CoStreamSchema<Item extends Schema = Schema>
    extends Schema<CoStream<Item>>,
        CoValueSchemaBase<CoStream<Item>, RawCoStream<RawType<Item>>> {
    _Type: "costream";
    _Item: Item;

    new (options: { owner: Account | Group }): CoStream<Item>;

    fromRaw(raw: RawCoStream<RawType<Item>>): CoStream<Item>;

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
    class CoStreamSessionStream implements CoStreamStream<Item> {
        parent: CoStreamSchemaForItem;
        sessionID: SessionID;
        loadedAs: ControlledAccount;

        constructor(parent: CoStreamSchemaForItem, sessionID: SessionID) {
            this.parent = parent;
            this.sessionID = sessionID;
            this.loadedAs = SimpleAccount.ControlledSchema.fromRaw(
                parent._raw.core.node.account as RawControlledAccount
            );
        }

        get last(): CoStreamEntry<Item> | undefined {
            const rawItem = this.parent._raw.lastItemIn(this.sessionID);

            if (!rawItem) return;

            return itemFor(this.parent, rawItem, this.loadedAs);
        }

        get all(): CoStreamEntry<Item>[] {
            return [...this.parent._raw.itemsIn(this.sessionID)].map(
                (rawItem) => itemFor(this.parent, rawItem, this.loadedAs)
            );
        }
    }

    class CoStreamAccountStream implements CoStreamStream<Item> {
        parent: CoStreamSchemaForItem;
        accountID: AccountID | AgentID;
        loadedAs: ControlledAccount;

        constructor(parent: CoStreamSchemaForItem, accountID: AccountID) {
            this.parent = parent;
            this.accountID = accountID;
            this.loadedAs = SimpleAccount.ControlledSchema.fromRaw(
                parent._raw.core.node.account as RawControlledAccount
            );
        }

        get last(): CoStreamEntry<Item> | undefined {
            const rawItem = this.parent._raw.lastItemBy(this.accountID);

            if (!rawItem) return;

            return itemFor(this.parent, rawItem, this.loadedAs);
        }

        get all(): CoStreamEntry<Item>[] {
            return [...this.parent._raw.itemsBy(this.accountID)].map(
                (rawItem) => itemFor(this.parent, rawItem, this.loadedAs)
            );
        }
    }

    function itemFor(
        inStream: CoStreamSchemaForItem,
        rawItem: {
            by: AccountID | AgentID;
            tx: CojsonInternalTypes.TransactionID;
            at: Date;
            value: RawType<Item>;
        },
        as: ControlledAccount
    ): CoStreamEntry<Item> {
        if (isCoValueSchema(ItemSchema)) {
            const ref = ValueRef(rawItem.value, ItemSchema, as);
            const value = ref.value as Item["_Value"] | undefined;
            return {
                get value() {
                    if (inStream[subscriptionScopeSym]) {
                        inStream[subscriptionScopeSym]?.onRefAccessedOrSet(
                            inStream.id,
                            rawItem.tx.sessionID + "_" + rawItem.tx.txIndex,
                            ref.id,
                            ItemSchema
                        );
                    }
                    return value;
                },
                ref: ref as Item["_Value"] extends CoValue
                    ? ValueRef<Item["_Value"]>
                    : undefined,
                tx: rawItem.tx,
                at: rawItem.at,
            };
        } else {
            return {
                value: rawItem.value,
                ref: undefined as Item["_Value"] extends CoValue
                    ? ValueRef<Item["_Value"]>
                    : undefined,
                tx: rawItem.tx,
                at: rawItem.at,
            };
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
            return this._raw
                .sessions()
                .map((sessionID) => [
                    sessionID,
                    new CoStreamSessionStream(this, sessionID),
                ]);
        }

        get byAccount(): [AccountID, CoStreamStream<Item>][] {
            return [...this._raw.accounts()].map((accountID) => [
                accountID,
                new CoStreamAccountStream(this, accountID),
            ]);
        }
    }

    return CoStreamSchemaForItem as CoStreamSchema<Item>;
}


