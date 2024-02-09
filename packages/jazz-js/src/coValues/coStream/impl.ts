import {
    RawCoStream as RawCoStream,
    SessionID,
    CojsonInternalTypes,
    AccountID,
    CoID,
    RawControlledAccount,
    AgentID
} from "cojson";
import { Account, ControlledAccount } from "../account/account.js";
import { RawType } from "../../baseInterfaces.js";
import { ID } from "../../id.js";
import { CoValueBase } from "../../baseInterfaces.js";
import { Schema } from "../../schema.js";
import { Chunk, Effect, Stream } from "effect";
import { CoValueUnavailableError, UnknownCoValueLoadError } from "../../errors.js";
import { ValueRef } from "../../valueRef.js";
import { SubscriptionScope } from "../../subscriptionScope.js";
import { isCoValueSchema } from "../../guards.js";
import { ControlledAccountCtx } from "../../services.js";
import { Group } from "../group/group.js";
import { SimpleAccount } from "../account/simpleAccount.js";
import { subscriptionScopeSym } from "../../subscriptionScopeSym.js";
import { CoStreamSessionEntries, CoStreamAccountEntries, CoStreamEntry } from "./entries.js";
import { CoStreamMeta } from "./meta.js";
import { CoStreamSchema, CoStream } from "./coStream.js";


export function CoStreamOf<Item extends Schema>(
    ItemSchema: Item
): CoStreamSchema<Item> {
    class CoStreamSessionEntriesForItem
        implements CoStreamSessionEntries<Item>
    {
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
            console.log(
                "_raw.core.sessionLogs",
                this.parent._raw.core._sessionLogs
            );
            console.log(
                "_raw.core.validSortedTransactions",
                this.parent._raw.core.getValidSortedTransactions()
            );
            console.log("_raw.items", this.parent._raw.items);
            console.log("itemsIn", [
                ...this.parent._raw.itemsIn(this.sessionID),
            ]);
            return [...this.parent._raw.itemsIn(this.sessionID)].map(
                (rawItem) => itemFor(this.parent, rawItem, this.loadedAs)
            );
        }
    }

    class CoStreamAccountEntriesForItem
        implements CoStreamAccountEntries<Item>
    {
        parent: CoStreamSchemaForItem;
        accountID: AccountID;
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
                ref: ref as Item["_Value"] extends CoValueBase ? ValueRef<Item["_Value"]> : undefined,
                tx: rawItem.tx,
                at: rawItem.at,
            };
        } else {
            return {
                value: rawItem.value,
                ref: undefined as Item["_Value"] extends CoValueBase ? ValueRef<Item["_Value"]> : undefined,
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

        constructor(options: { owner: Account | Group; });
        constructor(options: { fromRaw: RawCoStream<RawType<Item>>; });
        constructor(
            options: { owner: Account | Group; } |
            { fromRaw: RawCoStream<RawType<Item>>; }
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
            { as }: { as: ControlledAccount; }
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
            ControlledAccount, CoValueUnavailableError | UnknownCoValueLoadError, CoStream<Item>
        > {
            return Effect.gen(function* ($) {
                const as = yield* $(ControlledAccountCtx);
                const raw = yield* $(
                    Effect.tryPromise({
                        try: () => as._raw.core.node.load(
                            id as unknown as CoID<
                                RawCoStream<RawType<Item>>
                            >
                        ),
                        catch: (cause) => new UnknownCoValueLoadError({ cause }),
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
            ControlledAccountCtx, CoValueUnavailableError | UnknownCoValueLoadError, CoStream<Item>
        > {
            throw new Error(
                "TODO: implement somehow with Scope and Stream.asyncScoped"
            );
        }

        static subscribe(
            id: ID<CoStream<Item>>,
            { as }: { as: ControlledAccount; },
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
            return Stream.asyncScoped((emit) => Effect.gen(function* ($) {
                const unsub = self.subscribe((value) => {
                    void emit(Effect.succeed(Chunk.of(value)));
                });

                yield* $(Effect.addFinalizer(() => Effect.sync(unsub)));
            })
            );
        }

        subscribe(listener: (newValue: CoStream<Item>) => void): () => void {
            const subscribable = CoStreamSchemaForItem.fromRaw(this._raw);
            const scope = new SubscriptionScope(
                subscribable,
                CoStreamSchemaForItem,
                (update) => {
                    listener(update);
                }
            );

            return () => {
                scope.unsubscribeAll();
            };
        }

        toJSON() {
            return {
                bySession: this.bySession.map((entries) => ({
                    sessionID: entries.sessionID,
                    all: entries.all.map((item) => item.value?.toJSON()),
                })),
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
                const refIdx = currentSessionID +
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

        get bySession(): CoStreamSessionEntries<Item>[] {
            return this._raw
                .sessions()
                .map(
                    (sessionID) => new CoStreamSessionEntriesForItem(this, sessionID)
                );
        }

        get byAccount(): CoStreamAccountEntries<Item>[] {
            return [...this._raw.accounts()].map(
                (accountID) => new CoStreamAccountEntriesForItem(this, accountID)
            );
        }
    }

    return CoStreamSchemaForItem as CoStreamSchema<Item>;
}
